var ball=new Ball(10);

var canvas=document.getElementById("myCanvas");
var context=canvas.getContext("2d");
function animation(){
    return new Promise(function (resolve) {
        //做一些异步操作
        ball.position.x=0;
        ball.position.y=0;
        function animationLoop(){
            context.clearRect(0,0,1000,1000);
            ball.position.x+=10;
            ball.position.y+=10;
            ball.draw(context);
            if(ball.position.x>500)
            {
                resolve();
                return;
            }
            requestAnimationFrame(animationLoop);

        }
        animationLoop();
    });
}
async function steps(step) {
    for(i=0;i<step;i++)
    {
        await animation();
        console.log(i);
    }
}
steps(4);



















