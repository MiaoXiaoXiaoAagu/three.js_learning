if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var meshes = [], mixers = [], pointLight, camera, scene, renderer, controls;
var clock = new THREE.Clock;

init();
animate();

function init()
{
    initScene();
    initLight();
    initRender();
    initCamara();
    initContrls();
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

    var loader = new THREE.JDLoader();
    loader.load("model/JD.JD",
        function (data)
        {
            for (var i = 0; i < data.objects.length; ++i)
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


                    if (mesh && mesh.geometry.animations)
                    {
                        var mixer = new THREE.AnimationMixer(mesh);
                        mixers.push(mixer);
                        var actions=[];//多轨道动画储存
                        for(var j=0;j<mesh.geometry.animations.length;j++)
                        {
                            actions[j] = mixer.clipAction(mesh.geometry.animations[j]);
                        }

                        addModelAnimations("JD",actions);//addModelAnimations(名称,控制动画开始、暂停的actions)

                    }
                }

            }


        });

    var loader = new THREE.GLTFLoader();
    loader.load( 'model/gltf1/gltf1.gltf', function ( gltf ) {
        var boxes = gltf.scene;
        boxes.position.set(0,0,300);
        scene.add( boxes );
        var mixer = new THREE.AnimationMixer(boxes);
        mixers.push(mixer);//添加到全局的mixers以便加载动画  add mixer in global mixers for animation
        var actions=[];
        for(var i=0;i<gltf.animations.length;i++) {
            actions[i] =mixer.clipAction(gltf.animations[i]);
        }
        addModelAnimations("GLTF",actions);
    } );

    //加载模型
    //add model
    var loader = new THREE.ColladaLoader();
    loader.load("model/animationDAE.dae", function (mesh) {

        console.log(mesh);
        var boxes = mesh.scene; //获取到模型对象 get model
        //添加骨骼辅助 add skeleton helper
        meshHelper = new THREE.SkeletonHelper(boxes);
        scene.add(meshHelper);
        //设置模型的每个部位都可以投影 make each part of model get shadow
        boxes.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        boxes.position.set(0,0,600);
        boxes.scale.set(1,1,1);
        scene.add(boxes);
        mixer = boxes.mixer = new THREE.AnimationMixer(boxes);
        mixers.push(mixer);
        var actions=[];
        for(var i=0;i<mesh.animations.length;i++) {
            actions[i] =mixer.clipAction(mesh.animations[i]);
        }
        addModelAnimations("DAE",actions);
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

var addModelAnimations=function () {//addModelAnimations(名称,控制动画开始、暂停的actions) name:string actions:return of .clipAction()
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
}();

function initCamara() {
    var near = 1, far =5000;
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, near, far);
    camera.position.set( 100, 500, 500 );
    camera.lookAt(new THREE.Vector3( 0, 500, 500 ));
    camera.add(new THREE.DirectionalLight(0xFFFFFF, 1));
    scene.add(camera);

}

function initContrls() {
    if (!controls) {controls = new THREE.OrbitControls(camera, renderer.domElement);}
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

function animate()
{
    var delta = clock.getDelta();
    for (var i = 0; i < mixers.length; ++i)
        mixers[i].update(delta);

    if (controls) controls.update();

    if (camera)  renderer.render(scene, camera);

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

