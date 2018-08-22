

/*待整理*/
/*移动人物的gui和相机切换的整理*/
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var meshes = [], mixers = [], pointLight, camera, scene, renderer, controls;
var clock = new THREE.Clock;
var start=new Date();
var people,guiControl;
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

