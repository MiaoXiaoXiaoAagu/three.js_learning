var people;
var turningModel,turnings=[],scene;
function Turning(mesh,position,angle,road){
    this.mesh=mesh.clone();
    this.position=position;
    this.angle=angle;
    this.road="road"+road;
}
Turning.prototype.initTurning=function(){
    var mesh=this.mesh;
    mesh.position.set(this.position.x,0,this.position.y);
    mesh.rotateY(Math.PI*(this.angle/180));
};

initScene();
function initScene() {//初始化好场景，并且把全局变量people赋值
    /*待整理*/
    /*移动人物的gui和相机切换的整理*/
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    var meshes = [], mixers = [], camera, renderer, controls;
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
        initModel();
        //renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        renderer.domElement.addEventListener( 'click', onDocumentClick, false );
    }
    function onDocumentClick(e) {
        e.preventDefault();
        var mouse = new THREE.Vector2();
        //将鼠标点击位置的屏幕坐标转成threejs中的标准坐标,具体解释见代码释义
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        //新建一个三维单位向量 假设z方向就是0.5
        //根据照相机，把这个向量转换到视点坐标系
        var vector = new THREE.Vector3(mouse.x, mouse.y,0.5).unproject(camera);

        //在视点坐标系中形成射线,射线的起点向量是照相机， 射线的方向向量是照相机到点击的点，这个向量应该归一标准化。
        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        //射线和模型求交，选中一系列直线
        var objects=[];
        for(var i=0;i<turnings.length;i++)
        {
            objects.push(turnings[i].mesh);
        }
        var intersects = raycaster.intersectObjects(objects);
        console.log('imtersrcts=' + intersects);

        if (intersects.length > 0) {
            //选中第一个射线相交的物体
            SELECTED = intersects[0].object;
            var intersected = intersects[0].object;
            console.log(intersects[0].object);
            var originShape=intersected.scale.x;
            var magnification=1.05;
            function bigger(){
                if(originShape<1)
                {
                    originShape*=magnification;
                    intersected.scale.set(originShape,originShape,originShape);
                    requestAnimationFrame(bigger);
                }
            }
            bigger();
            setTimeout(function () {
                scene.remove(intersected);
            },3000);

        }


    }

    function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xa0a0a0 );

    }

    function initLight() {
        scene.add(new THREE.AmbientLight(0x444444));

    }

    function initModel() {

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
        loader.load("source/model/people.JD", function (data) {

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
        loader.load("source/model/map.JD", function (data) {

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

        function initTurning(mesh,scene) {
            var turning=new Turning(mesh,new Vector2(-82,10),60,"B_A");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(-82,150),115,"B_D");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(235,104),-90,"B_C");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(-1013,-625),90,"A_End");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(-790,-697),-45,"A_C");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(-764,-511),-135,"A_B");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(776,85),90,"C_B");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(977,104),-90,"C_A");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(865,210),-180,"C_D");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(885,985),0,"D_C");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(778,1140),135,"D_B");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(977,1168),-135,"D_Start");
            turnings.push(turning);
            var turning=new Turning(mesh,new Vector2(1500,1350),90,"Start_D");
            turnings.push(turning);
            for(var i=0;i<turnings.length;i++)
            {
                turnings[i].initTurning();
                scene.add(turnings[i].mesh);
            }
        }
        //load turning
        var loader = new THREE.JDLoader();
        loader.load("source/model/turning.JD", function (data) {

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
                    mesh.scale.set(0.5,0.5,0.5);
                    initTurning(mesh,scene);
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
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, near, far);
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
            if(turningModel)
            {    //gui面板控制人物移动
                turningModel.position.x=guiControl.x;
                turningModel.position.z=guiControl.z;
                //人物移动显示在gui面板
                guiControl.x=turningModel.position.x;
                guiControl.z=turningModel.position.z;
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
var nodes=[],roads={},dicesSrc=[];
var map = new graphlib.Graph();
/*graphlib.js*/


//复制一条路线相反的路
var cloneRoad = function (oldRoad) {
   var newRoad=new Road();
   //反序拷贝stepNodes;
    for(var i=oldRoad.stepNodes.length-1,item=oldRoad.stepNodes[i];item=oldRoad.stepNodes[i];i--)
    {
        newRoad.stepNodes.push(item);
    }
    return newRoad;
};

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
    this.playedGame=false;
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
Road.prototype.reverse=function(){
    if(!this.stepNodes)
    {
        alert("please init stepNodes of road first");
    }
    else{
        this.stepNodes.reverse();
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
                //console.log("x:"+people.position.x+"    y:"+people.position.z+" "+i);
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

function initNodes(){
    nodes.push(new Node("1",new Vector2(-916,-621),function () {
        console.log("play game 1");
    }));
    nodes.push(new Node("2",new Vector2(-373,-952)));
    nodes.push(new Node("3",new Vector2(104,-606)));
    nodes.push(new Node("4",new Vector2(956,-606),function () {
        console.log("play game 4");
    }));
    nodes.push(new Node("5",new Vector2(1890,-606),function () {
        console.log("play game 5");
    }));
    nodes.push(new Node("6",new Vector2(1890,110)));
    nodes.push(new Node("7",new Vector2(1621,110),function () {
        console.log("play game 7");
    }));
    nodes.push(new Node("8",new Vector2(868,110)));
    nodes.push(new Node("9",new Vector2(75,103),function () {
        console.log("play game 9");
    }));
    nodes.push(new Node("10",new Vector2(-1002,438),function () {
        console.log("play game 10");
    }));
    nodes.push(new Node("11",new Vector2(-1573,499)));
    nodes.push(new Node("12",new Vector2(-1573,1338)));
    nodes.push(new Node("13",new Vector2(-732,1201),function () {
        console.log("play game 13");
    }));
    nodes.push(new Node("14",new Vector2(-503,1095)));
    nodes.push(new Node("15",new Vector2(-136,1320)));
    nodes.push(new Node("16",new Vector2(232,1069),function () {
        console.log("play game 16");
    }));
    nodes.push(new Node("17",new Vector2(568,1350)));
    nodes.push(new Node("18",new Vector2(872,1096)));
    nodes.push(new Node("19",new Vector2(868,497),function () {
        console.log("play game 19");
    }));
    nodes.push(new Node("20",new Vector2(1274,1341),function () {
        console.log("play game 20");
    }));
    nodes.push(new Node("21",new Vector2(1890,1341)));
    nodes.push(new Node("22",new Vector2(-1573,-621)));
}
initNodes();

function initRoad() {
    var roadStart_D=new Road();
    (function(){//初始化第一条路
        roadStart_D.addDirectionNodes(nodes[21-1]);
        roadStart_D.addDirectionNodes(nodes[20-1]);
        roadStart_D.addDirectionNodes(nodes[18-1]);
        roadStart_D.initStepNodes();
        //console.log(roadStart_D.stepNodes);
    })();
    var roadD_Start=cloneRoad(roadStart_D);
    roads["roadStart_D"]=roadStart_D;
    roads["roadD_Start"]=roadD_Start;

    var roadD_C=new Road();
    (function(){//初始化第一条路
        roadD_C.addDirectionNodes(nodes[18-1]);
        roadD_C.addDirectionNodes(nodes[19-1]);
        roadD_C.addDirectionNodes(nodes[8-1]);
        roadD_C.initStepNodes();
       // console.log(roadD_C.stepNodes);
    })();
    var roadC_D=cloneRoad(roadD_C);
    roads["roadD_C"]=roadD_C;
    roads["roadC_D"]=roadC_D;

    var roadC_B=new Road();
    (function(){//初始化第一条路
        roadC_B.addDirectionNodes(nodes[8-1]);
        roadC_B.addDirectionNodes(nodes[9-1]);
        roadC_B.initStepNodes();
        //console.log(roadC_B.stepNodes);
    })();
    var roadB_C=cloneRoad(roadC_B);
    roads["roadC_B"]=roadC_B;
    roads["roadB_C"]=roadB_C;

    var roadC_A=new Road();
    (function(){//初始化第一条路
        roadC_A.addDirectionNodes(nodes[8-1]);
        roadC_A.addDirectionNodes(nodes[7-1]);
        roadC_A.addDirectionNodes(nodes[6-1]);
        roadC_A.addDirectionNodes(nodes[5-1]);
        roadC_A.addDirectionNodes(nodes[4-1]);
        roadC_A.addDirectionNodes(nodes[3-1]);
        roadC_A.addDirectionNodes(nodes[2-1]);
        roadC_A.addDirectionNodes(nodes[1-1]);
        roadC_A.initStepNodes();
        //console.log(roadC_A.stepNodes);
    })();
    var roadA_C=cloneRoad(roadC_A);
    roads["roadC_A"]=roadC_A;
    roads["roadA_C"]=roadA_C;

    var roadA_End=new Road();
    (function(){//初始化第一条路
        roadA_End.addDirectionNodes(nodes[1-1]);
        roadA_End.addDirectionNodes(nodes[22-1]);
        roadA_End.initStepNodes();
        //console.log(roadA_End.stepNodes);
    })();
    var roadEnd_A=cloneRoad(roadA_End);
    roads["roadA_End"]=roadA_End;
    roads["roadEnd_A"]=roadEnd_A;

    var roadA_B=new Road();
    (function(){//初始化第一条路
        roadA_B.addDirectionNodes(nodes[1-1]);
        roadA_B.addDirectionNodes(nodes[9-1]);
        roadA_B.initStepNodes();
        //console.log(roadA_B.stepNodes);
    })();
    var roadB_A=cloneRoad(roadA_B);
    roads["roadA_B"]=roadA_B;
    roads["roadB_A"]=roadB_A;

    var roadD_B=new Road();
    (function(){//初始化第一条路
        roadD_B.addDirectionNodes(nodes[18-1]);
        roadD_B.addDirectionNodes(nodes[17-1]);
        roadD_B.addDirectionNodes(nodes[16-1]);
        roadD_B.addDirectionNodes(nodes[15-1]);
        roadD_B.addDirectionNodes(nodes[14-1]);
        roadD_B.addDirectionNodes(nodes[13-1]);
        roadD_B.addDirectionNodes(nodes[12-1]);
        roadD_B.addDirectionNodes(nodes[11-1]);
        roadD_B.addDirectionNodes(nodes[10-1]);
        roadD_B.addDirectionNodes(nodes[9-1]);
        roadD_B.initStepNodes();
        //console.log(roadD_B.stepNodes);
    })();
    var roadB_D=cloneRoad(roadD_B);
    roads["roadD_B"]=roadD_B;
    roads["roadB_D"]=roadB_D;
}
initRoad();

function initMap() {
    map.setNode("Start",nodes[21-1]);
    map.setNode("D",nodes[18-1]);
    map.setEdge("Start","D",roads["roadStart_D"]);
    map.setEdge("D","Start",roads["roadD_Start"]);

    map.setNode("C",nodes[8-1]);
    map.setEdge("D","C",roads["roadD_C"]);
    map.setEdge("C","D",roads["roadC_D"]);

    map.setNode("A",nodes[1-1]);
    map.setEdge("C","A",roads["roadC_A"]);
    map.setEdge("A","C",roads["roadA_C"]);

    map.setNode("B",nodes[9-1]);
    map.setEdge("C","B",roads["roadC_B"]);
    map.setEdge("B","C",roads["roadB_C"]);

    map.setEdge("A","B",roads["roadA_B"]);
    map.setEdge("B","A",roads["roadB_A"]);

    map.setNode("End",nodes[22-1]);
    map.setEdge("A","End",roads["roadA_End"]);
    map.setEdge("End","A",roads["roadEnd_A"]);

    map.setEdge("B","D",roads["roadB_D"]);
    map.setEdge("D","B",roads["roadD_B"]);

}
initMap();

function initDice(){
    for(var i=0;i<6;i++)
    {
        dicesSrc.push("source/images/dice"+(i+1)+".png");
    }
}
initDice();
//生成从minNum到maxNum的随机数
function randomNum(minNum,maxNum){
    switch(arguments.length){
        case 1:
            return parseInt(Math.random()*minNum+1,10);
            break;
        case 2:
            return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10);
            break;
        default:
            return 0;
            break;
    }
}


setTimeout(function () {//假装用户的第一次操作  因为之前不会promise，用的全局变量people就要等people加载好之后再操作

    diceStep=6;
    function roadWalking(walkingRoad) {//在一条路上走
        return new Promise(function (resolved) {

            async function roadSteps() {//还是在一条路上走，只不过注重每一步的动画和游戏
                console.log("挪了一步");
                //每次挪完就判断是否到了路的末尾//如果到了就结束在路上的行走，没有到就继续走(递归)
                var n=Math.min(roadLength,diceStep);
                if(0===roadLength)
                {
                    return 0;
                }else{
                    for(i=0;i<n;i++)
                    {
                        await walkingRoad.toNextStep();
                        await new Promise(function (resolve) {//每一步之后的停顿
                            setTimeout(function () {
                                return resolve();
                            },500);
                        });
                        diceStep--;
                        roadLength--;
                        //console.log("for循环了"+(i+1)+"次"+"  step:"+diceStep+"   "+"roadLenth"+roadLength);
                        /*await new Promise(function (resolve) {//每走一步的停顿
                            setTimeout(function () {
                                return resolve();
                            },500)
                        });*/
                        if(0===diceStep)
                        {
                            console.log("请点击骰子");
                            setTimeout(function () {
                                $('#throwDice').addClass('animated swing');
                            },500);

                            await new Promise(function (resolve) {//等待骰子的图标被点击
                                $("#throwDice").unbind().click(function () {
                                    $('#throwDice').removeClass('animated swing');
                                    diceStep=randomNum(1,6);
                                    $("#dice_result").attr("src",dicesSrc[diceStep-1]);
                                    $('#dice_result').addClass('animated flipInY');
                                    console.log("再扔了一次筛子数为"+diceStep);
                                    $("#diceModal").modal('toggle');
                                    return resolve();
                                });
                            });
                            await new Promise(function (resolve) {//异步加载筛子的动画
                                setTimeout(function () {
                                    $('#dice_result').removeClass('animated flipInY');
                                    $("#diceModal").modal('toggle');
                                    return resolve();
                                },2000)
                            });


                        }
                    }

                    //console.log("走完了骰子或者路长"+time+"次"+"   现在路的长度是："+roadLength+ "现在的step是："+diceStep);
                    await roadSteps();
                }
            }
            var roadLength=walkingRoad.stepNodes.length-1;//因为是递归要用的变量，所以提到roadSteps外面
            roadSteps().then(function () {return resolved("finish a road")});

        });
    }

    async function mapGame(){
        var turningNow="Start",turningNext;//原点是start
        var walkingRoad=roads["roadStart_D"];
        for(var i=0;i<20;i++)//最多走20条路
        {
            if(people.position.x===nodes[22-1].position.x&&people.position.z===nodes[22-1].position.y)//到达终点
            {
                alert("到达终点");
                return ;
            }
            else{
                await (function () {//选择路线
                    return new Promise(function (resolve) {
                        var outEdges=map.outEdges(turningNow);
                        var optionsNode=[];//当前点的目标点名称集
                        for(var i=0,item=outEdges[i];item=outEdges[i];i++)
                        {
                            optionsNode.push(item.w);
                            var temp=' <input type="radio" name="optionsRadios" id="optionsRadios'+i+'" value="option'+i+'" checked>'+item.w;
                            $(".radio").eq(i).children("label").html(temp);
                        }
                        $('#myModal').modal('toggle');
                        $("#closeModal").click(function () {
                            turningNext=$("input[type=radio]:checked").parent("label").text().substring(1);
                            var walkingRoadString='road'+turningNow+'_'+turningNext;
                            walkingRoad=roads[walkingRoadString];
                            return resolve();
                        })

                    });
                })();

                await roadWalking(walkingRoad);//走路线
                turningNow=turningNext;
            }
        }
    }
    mapGame();
    //roadWalking(roads["roadStart_D"]);
},1500);





