var people;
initScene();
function initScene() {//初始化好场景，并且把全局变量people赋值
    /*待整理*/
    /*移动人物的gui和相机切换的整理*/
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    var meshes = [], mixers = [], camera, scene, renderer, controls;
    var clock = new THREE.Clock;
    var guiControl;


    init();
    animate();

    function init()
    {
        initScene();
        initLight();
        initRender();
        initPerspecCamara();
        switchCamara();
        camera.add(new THREE.DirectionalLight(0xFFFFFF, 1));
        window.addEventListener('resize', onWindowResize, false);
        initMoldel();


    }


    function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xa0a0a0 );

    }

    function initLight() {
        scene.add(new THREE.AmbientLight(0x444444));

    }

    function initMoldel() {

        var axesHelper = new THREE.AxesHelper( 5 );
        scene.add( axesHelper );
        // 地板
        //floor
        var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0xffffff, depthWrite: false } ) );
        mesh.rotation.x = - Math.PI / 2;
        mesh.receiveShadow = true;
        scene.add( mesh );

        //添加地板割线
        //add floor grid line
        var grid = new THREE.GridHelper( 2000, 20, 0x000000, 0x000000 );
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        scene.add( grid );
        //load people
        var loader = new THREE.JDLoader();
        loader.load("model/people.JD", function (data) {

            for (var i =  data.objects.length-1; i < data.objects.length; ++i)
            {

                if (data.objects[i].type == "Mesh" || data.objects[i].type == "SkinnedMesh")
                {
                    var mesh = null;
                    var matArray = createMaterials(data);
                    if (data.objects[i].type == "SkinnedMesh")
                    {
                        mesh = new THREE.SkinnedMesh(data.objects[i].geometry, matArray);
                    }
                    else // Mesh
                    {
                        mesh = new THREE.Mesh(data.objects[i].geometry, matArray);
                    }
                    meshes.push(mesh);
                    scene.add(mesh);
                    debugPosition(mesh,"people");
                    people=mesh;
                    if (mesh && mesh.geometry.animations)
                    {
                        var mixer = new THREE.AnimationMixer(mesh);
                        mixers.push(mixer);
                        var actions=[];//多轨道动画储存
                        for(var j=0;j<mesh.geometry.animations.length;j++)
                        {
                            actions[j] = mixer.clipAction(mesh.geometry.animations[j]);
                        }

                        //addModelAnimations("JD"+i,actions);//addModelAnimations(名称,控制动画开始、暂停的actions)

                    }


                }

            }


        });
        //load map
        var loader = new THREE.JDLoader();
        loader.load("model/map.JD", function (data) {

            for (var i =  data.objects.length-1; i < data.objects.length; ++i)
            {

                if (data.objects[i].type == "Mesh" || data.objects[i].type == "SkinnedMesh")
                {
                    var mesh = null;
                    var matArray = createMaterials(data);
                    if (data.objects[i].type == "SkinnedMesh")
                    {
                        mesh = new THREE.SkinnedMesh(data.objects[i].geometry, matArray);
                    }
                    else // Mesh
                    {
                        mesh = new THREE.Mesh(data.objects[i].geometry, matArray);
                    }
                    meshes.push(mesh);
                    // mesh.scale.set(0.5,0.5,0.5);
                    mesh.position.set(160,0,0);
                    scene.add(mesh);


                }

            }


        });
    }



    function initRender() {
        var container = document.createElement('div');
        document.body.appendChild(container);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
    }
    function createMaterials(data)
    {
        var matArray = [];
        for (var j = 0; j < data.materials.length; ++j)
        {
            var mat = new THREE.MeshPhongMaterial({});
            mat.copy(data.materials[j]);
            //mat.transparent = true;
            matArray.push(mat);
        }
        return matArray;
    }
    var debugPosition=(function () {
        var datGui= new dat.GUI();
        return function (obj,name) {
            var objFolder=datGui.addFolder(name);
            var controls= new function () {
                this.x=obj.position.x;
                this.z=obj.position.z;
            };
            objFolder.add(controls,"x");
            objFolder.add(controls,"z");
            guiControl=controls;

        };
    })();

//添加面板调试动画
    var addModelAnimations=(function () {//addModelAnimations(名称,控制动画开始、暂停的actions) name:string actions:return of .clipAction()
        var datGui= new dat.GUI();//dat.GUI库 闭包，新建一个控制多个模型的面板  new a panel to debug models by dat.GUI binary
        //要新建多个自己再改吧
        //Change it yourself if you need more panel
        return function (modelName,actions) {

            var modelActions=datGui.addFolder(modelName);//新建模型folder     make a new folder for model
            var beginActions=modelActions.addFolder("beginActions");//新建启动动画folder  folder to begin actions
            var stopActions=modelActions.addFolder("stopActions");//新建停止动画folder    folder to stop actions

            for(var i=0;i<actions.length;i++)
            {
                var beginGui={};
                (function (i) {//点击事件闭包存储i  handle event of click
                    beginGui["action"+i]=function () {actions[i].play();};
                    beginActions.add(beginGui,"action"+i);
                })(i);

            }

            for(var i=0;i<actions.length;i++)
            {
                var stopGui={};
                (function (i) {
                    stopGui["action"+i]=function () {actions[i].stop();}
                    stopActions.add(stopGui,"action"+i);
                })(i);

            }

        }
    })();
    function switchCamara() {
        var controls = new function () {
            this.perspective = "Perspective";
            this.switchCamera = function () {
                if (camera instanceof THREE.PerspectiveCamera) {
                    initOrthoCamera();
                    this.perspective = "Orthographic";
                } else {
                    initPerspecCamara();
                    this.perspective = "Perspective";
                }
            };
        };

        var gui = new dat.GUI();
        gui.add(controls, 'switchCamera');
        gui.add(controls, 'perspective').listen();
    }

    function initPerspecCamara() {
        var near = 1, far =5000;
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, near, far);
        camera.position.set( 0,500, 500 );
        camera.lookAt(scene.position);
        scene.add(camera);
        initContrls();

    }
    function initOrthoCamera(){
        camera = new THREE.OrthographicCamera(window.innerWidth / -0.7, window.innerWidth / 0.7, window.innerHeight /0.7, window.innerHeight / -0.5, -200, 5000);
        camera.position.set( 0,800, 500 );
        camera.lookAt(scene.position);
        scene.add(camera);
    }
    function initContrls() {
        if (!controls) {controls = new THREE.OrbitControls(camera, renderer.domElement);}
    }

    function animate()
    {
        var delta = clock.getDelta();
        for (var i = 0; i < mixers.length; ++i)
        {
            mixers[i].update(delta);
        }

        (function () {
            if(people)
            {    //gui面板控制人物移动
                /*people.position.x=guiControl.x;
                people.position.z=guiControl.z;*/
                //人物移动显示在gui面板
                guiControl.x=people.position.x;
                guiControl.z=people.position.z;
            }

        })();
        if (controls) {controls.update();}
        if (camera){renderer.render(scene, camera);}


        requestAnimationFrame(animate);
    }

    function onWindowResize()
    {
        if (camera)
        {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /*
    information of gltf
    https://neil3d.github.io/3dengine/gltf-scene.html  glTF3D引擎结构
    https://www.khronos.org/gltf/  官方docs + 格式转换工具
    https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md  github
    * */
}

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
                people.position.z=start.y;
                console.log("x:"+people.position.x+"    y:"+people.position.z+" "+i);
                i++;
                if(i*standardSpeed>=length)
                {
                    people.position.x=end.x;
                    people.position.z=end.y;

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
    firstRoad.addDirectionNodes(new Node("1",new Vector2(1890,1314)));
    firstRoad.addDirectionNodes(new Node("2",new Vector2(1274,1341),function () {
        // console.log("play game 1");
    }));
    firstRoad.addDirectionNodes( new Node("3",new Vector2(872,1096)));
})();
setTimeout(function () {
    firstRoad.initStepNodes();
    console.log(firstRoad.stepNodes);
    walkingRoad=firstRoad;
    roadLength=21//Road.length-1;
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
                await new Promise(function (resolve) {//每走一步的停顿
                    setTimeout(function () {
                        return resolve();
                    },500)
                });
                if(0===diceStep)
                {
                    diceStep=3;//假装再扔一次筛子之后是3
                    /*await new Promise(function (resolve) {//异步加载筛子的动画
                        setTimeout(function () {
                            console.log("再扔了一次筛子");
                            return resolve();
                        },500)
                     });*/
                }

            }

            time++;
            console.log("走完了骰子或者路长"+time+"次"+"   现在路的长度是："+roadLength+ "现在的step是："+diceStep);
            roadSteps(time);
        }
    }
    roadSteps(0).then(function (value) { console.log("走完了这条路"+"    骰子数还有："+diceStep) });
},1500);


