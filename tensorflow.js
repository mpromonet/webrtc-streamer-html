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

        window.setTimeout( ()=>{ this.runDetect(model, video, canvas); } , 0 );
    });
}