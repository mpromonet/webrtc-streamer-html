console.log("tensorflow.js")

window.runDetect = (model, video, canvas) => {

    console.time('predict');
    // detect objects in the image.
    model.detect(video).then(predictions => {
        console.timeEnd('predict');
        console.log('Predictions: ', predictions);

        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = '10px Arial';

        console.log('number of detections: ', predictions.length);
        for (let i = 0; i < predictions.length; i++) {
            context.beginPath();
            context.rect(...predictions[i].bbox);
            context.lineWidth = 2;
            context.strokeStyle = 'green';
            context.fillStyle = 'green';
            context.stroke();
            context.fillText(
            predictions[i].score.toFixed(3) + ' ' + predictions[i].class, predictions[i].bbox[0],
            predictions[i].bbox[1] > 10 ? predictions[i].bbox[1] - 5 : 10);
        }

        window.setTimeout( ()=>{ window.runDetect(model, video, canvas); } , 0 );
    });
}

window.runPosenet = (model, video, canvas) => {

    console.time('predict');
    model.estimatePoses(video, {decodingMethod: 'multi-person', maxDetections: 5}).then(poses => {
        console.timeEnd('predict');
        console.log('Predictions: ', poses);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '10px Arial';

        poses.forEach(({score, keypoints}) => {
                console.log('keypoints: ', keypoints);
                for (let i = 0; i < keypoints.length; i++) {
                    const keypoint = keypoints[i];
                    if (keypoint.score >= 0.5) {
                        const {y, x} = keypoint.position;
                        console.log(keypoint.part, ' : ', x, "x", y);
                        ctx.beginPath();
                        ctx.arc(x, y, 3, 0, 2 * Math.PI);
                        ctx.fillStyle = 'red';
                        ctx.fill();
                    }
                }
                const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, 0.5);
                console.log('adjacentKeyPoints: ', adjacentKeyPoints);
          
                /*adjacentKeyPoints.forEach((keypoints) => {
                    drawSegment(toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,scale, ctx);
                });*/

        });

        window.setTimeout( ()=>{ window.runPosenet(model, video, canvas); } , 0 );
    });
}

window.runDeeplab = (model, video, canvas) => {

    console.time('predict');
    model.segment(video).then(deeplabOutput  => {
        console.timeEnd('predict');
        console.log('deeplabOutput: ', deeplabOutput );
        const {legend, height, width, segmentationMap} = deeplabOutput;

	const scalecanvas = document.createElement('canvas')
	scalecanvas.width = width;
	scalecanvas.height = height;
        const segmentationMapData = new ImageData(segmentationMap, width, height)
	var imageData = segmentationMapData.data;
	for(var i=0; i < imageData.length; i+=4){  
		if ( (imageData[i] ==0) && (imageData[i+1] ==0) && (imageData[i+2] ==0) && (imageData[i+3] ==255)) {
			 imageData[i+3] = 0;
		} else {
			imageData[i+3] = 200;
		}
	}
        scalecanvas.getContext('2d').putImageData(segmentationMapData, 0, 0);
	
        const ctx = canvas.getContext('2d');
        ctx.font = '16px Arial';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(scalecanvas, 0, 0, width, height, 0, 0, canvas.width, canvas.height);

        let cnt=0
        Object.keys(legend).forEach((label) => {
            const [red, green, blue] = legend[label];
        
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
	    ctx.fillRect(0,cnt*16+16, 32, 16);
            ctx.fillText(label, 40, cnt*16+32);
            cnt++
          });      

        window.setTimeout( ()=>{ window.runDeeplab(model, video, canvas); } , 0 );
    });
}
