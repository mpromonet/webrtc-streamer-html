function runDetect(model, video, canvas) {

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
            context.lineWidth = 1;
            context.strokeStyle = 'green';
            context.fillStyle = 'green';
            context.stroke();
            context.fillText(
            predictions[i].score.toFixed(3) + ' ' + predictions[i].class, predictions[i].bbox[0],
            predictions[i].bbox[1] > 10 ? predictions[i].bbox[1] - 5 : 10);
        }

        window.setTimeout( ()=>{ runDetect(model, video, canvas); } , 0 );
    });
}

function runPosenet(model, video, canvas) {

    console.time('predict');
    model.estimatePoses(video, {
        decodingMethod: 'multi-person',
        maxDetections: 5,
        scoreThreshold: 0.1,
        nmsRadius: 30
      } ).then(poses => {
        console.timeEnd('predict');
      //  console.log('Predictions: ', poses);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '10px Arial';

        poses.forEach(({score, keypoints}) => {
                console.log('keypoints: ', keypoints);
                for (let i = 0; i < keypoints.length; i++) {
                    const keypoint = keypoints[i];
                    if (keypoint.score >= 0.1) {
                        const {y, x} = keypoint.position;
                        console.log(keypoint.part, ' : ', x, "x", y);
                        ctx.beginPath();
                        ctx.arc(x, y, 3, 0, 2 * Math.PI);
                        ctx.fillStyle = 'red';
                        ctx.fill();
                    }
                }
        });

        window.setTimeout( ()=>{ runPosenet(model, video, canvas); } , 0 );
    });
}