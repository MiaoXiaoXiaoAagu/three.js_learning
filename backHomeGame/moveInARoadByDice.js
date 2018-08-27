var step=2;
var roadLength=4;
var ball=new Ball(10);
var canvas=document.getElementById("myCanvas");
var context=canvas.getContext("2d");
function Road() {
    
}
Road.prototype.animation=function () {
    return new Promise(function (resolve) {
        console.log("have a step");
        //做一些异步操作
        ball.position.x=0;
        ball.position.y=0;
        function animationLoop(){//一次动画相当于移动一步
            context.clearRect(0,0,1000,1000);
            ball.position.x+=10;
            ball.position.y+=10;
            ball.draw(context);
            if(ball.position.x>500)
            {

                //再添加一个playGame()的异步操作
                return resolve(new Promise(function (resolve,reject) {
                    setTimeout(function () {
                        console.log("play Game");
                        (function () {
                            return resolve();
                        })();

                    },1000)
                }));
            }
            requestAnimationFrame(animationLoop);
        }
        animationLoop();
    });
}
var road=new Road();
async function steps(time) {//每次挪完就判断是否到了路的末尾//如果到了就结束在路上的行走，没有到就继续走(递归)
    var n=Math.min(roadLength,step);
    if(0===roadLength)
    {
        return 0;
    }else{
        for(i=0;i<n;i++)
        {
            await road.animation();
            step--;
            roadLength--;
            if(0===step)
            {
                step=3;
                console.log("再扔了一次筛子");
            }
            console.log("for循环第"+i+"次"+"  step:"+step+"   "+"roadLenth"+roadLength);
        }
        console.log("后续操作");
        time++;
        console.log("走了"+time+"次"+"   现在路的长度是："+roadLength+ "现在的step是："+step);
        steps(time);
    }

}
steps(0).then(function (value) { console.log("走完了这条路"+"    骰子数还有："+step) });



















