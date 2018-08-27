var people=new Ball();
var canvas=document.getElementById("myCanvas");
var context=canvas.getContext("2d");

var standardStep=50;
var standardSpeed=10;
var walkingRoad,roadLength,diceStep;

function initMap() {

    /*graphlib.js*/
    var Graph = require("graphlib").Graph;
    var g = new Graph();

}
//向量
Vector2 = function(x, y) { this.x = x; this.y = y; };
Vector2.prototype = {
    copy: function() { return new Vector2(this.x, this.y); },
    length: function() { return Math.sqrt(this.x * this.x + this.y * this.y); },
    sqrLength: function() { return this.x * this.x + this.y * this.y; },
    normalize: function() { var inv = 1 / this.length(); return new Vector2(this.x * inv, this.y * inv); },
    negate: function() { return new Vector2(-this.x, -this.y); },
    add: function(v) { return new Vector2(this.x + v.x, this.y + v.y); },
    subtract: function(v) { return new Vector2(this.x - v.x, this.y - v.y); },
    multiply: function(f) { return new Vector2(this.x * f, this.y * f); },
    divide: function(f) { var invf = 1 / f; return new Vector2(this.x * invf, this.y * invf); },
    dot: function(v) { return this.x * v.x + this.y * v.y; }
};
//点
function Node(id,position,game) {//储存位置和游戏信息
    this.id=id;//string
    this.position=position;//vector
    this.game=game;//function
}
Node.prototype.getPosition=function () {
    return this.position;
};
Node.prototype.getID=function () {
    return this.id;
};
Node.prototype.playGame=function () {
    if(!this.game) {
        alert("please init game");
    }
    else{
        this.game();
    }
};
//一条路
function Road() {
    this.directionNodes=[];
    this.stepNodes=[];
    this.stepNodesCount=0;
    var self=this;


    this.initDirectRoad=function (start,end) { //计算出两点之间的所有步，并且加到this.setpNodes上,不加start,只加end
        var vector=end.position.subtract(start.position);
        var roadLenth=vector.length();
        var direction=vector.normalize();
        var stepNumber=Math.round(roadLenth/standardStep);//算出基于标准步长的步数
        var stepLength=Math.round(roadLenth/stepNumber);//算出基于本次步数的实际步长
        var stepVector=direction.multiply(stepLength);
        var thisStep=start.position;
        for(var i=0;i<stepNumber;i++)
        {
            if(i===stepNumber-1)
            {
                self.stepNodes.push(end);//加上尾点，尾点不是vector是node
            }
            else{
                thisStep=thisStep.add(stepVector);
                self.stepNodes.push(thisStep);//拐点之间都是加上的向量，根据stepNodes[i]的类型来判断是否要进行游戏
            }
        }
    }
}
Road.prototype.addDirectionNodes=function(node)
{
    this.directionNodes.push(node);
};
Road.prototype.initStepNodes=function()
{
    //directionNodes的每两点之间加一轮stepNodes
    for(var i=0;i<this.directionNodes.length-1;i++)
    {
        if(i===0)//首
        {
            this.stepNodes.push(this.directionNodes[0]);
        }
        this.initDirectRoad(this.directionNodes[i],this.directionNodes[i+1]);
    }
};

Road.prototype.toNextStep=function () {//判断点的类型  获取到步坐标 挪动到下一步 然后把下一步要进行的游戏全部进行完 每次到达下一步时都判断整条路是否走完。
    var self=this;
    return new Promise(function (resolve) {
        (function move(start,end) {//移动到下一步
            if(start instanceof Node)
            {
                start=start.position;
            }
            if(end instanceof Node)
            {
                end=end.position;
            }
            var vector=end.subtract(start);
            var direction=vector.normalize();
            var length=vector.length();
            var step=direction.multiply(standardSpeed);
            //每次start+=speed*direction 记录次数，直到speed*次数大于length 把最后一次的点定在start
            var i=1;

            function moveAnimation() {
                start=start.add(step);
                people.position.x=start.x;
                people.position.y=start.y;
                context.clearRect(0,0,500,500);
                people.draw(context);
                console.log("x:"+people.position.x+"    y:"+people.position.y+" "+i);
                i++;
                if(i*standardSpeed>=length)
                {
                    people.position.x=end.x;
                    people.position.y=end.y;

                    self.stepNodesCount++;
                    if(self.stepNodes[self.stepNodesCount] instanceof Node&&self.stepNodes[self.stepNodesCount].game)//如果到达游戏点并且有游戏，执行游戏
                    {
                        self.stepNodes[self.stepNodesCount].game();
                    }
                    if(self.stepNodesCount===self.stepNodes.length-1)
                    {
                        self.stepNodesCount=0;//路的数据初始化，以便走第二遍
                    }
                    return resolve();
                }

                requestAnimationFrame(moveAnimation);
            }
            moveAnimation();

        })(self.stepNodes[self.stepNodesCount],self.stepNodes[self.stepNodesCount+1]);

    });
};

var firstRoad=new Road();
(function(){//初始化一条路
    firstRoad.addDirectionNodes(new Node("1",new Vector2(0,0)));
    firstRoad.addDirectionNodes(new Node("2",new Vector2(200,0),function () {
        // console.log("play game 1");
    }));
    firstRoad.addDirectionNodes( new Node("3",new Vector2(500,500)));
})();
firstRoad.initStepNodes();
console.log(firstRoad.stepNodes);

walkingRoad=firstRoad;
roadLength=16;
diceStep=6;

async function roadSteps(time) {//每次挪完就判断是否到了路的末尾//如果到了就结束在路上的行走，没有到就继续走(递归)
    var n=Math.min(roadLength,diceStep);
    if(0===roadLength)
    {
        return 0;
    }else{
        for(i=0;i<n;i++)
        {
            await walkingRoad.toNextStep();
            diceStep--;
            roadLength--;
            console.log("for循环了"+(i+1)+"次"+"  step:"+diceStep+"   "+"roadLenth"+roadLength);
            if(0===diceStep)
            {
                diceStep=3;
                await new Promise(function (resolve) {
                    setTimeout(function () {
                        console.log("再扔了一次筛子");
                        return resolve();
                    },500)
                });

            }

        }

        time++;
        console.log("走完了骰子或者路长"+time+"次"+"   现在路的长度是："+roadLength+ "现在的step是："+diceStep);
        roadSteps(time);
    }
}
roadSteps(0).then(function (value) { console.log("走完了这条路"+"    骰子数还有："+diceStep) });
















