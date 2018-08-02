var meshes = [], mixers = [], hemisphereLight, pointLight, camera, scene, renderer, controls,gui;
var clock = new THREE.Clock;

init();
animate();

function init()
{
    initScene();
    initLight();
    initRender();
    window.addEventListener('resize', onWindowResize, false);
    initMoldel();
    initGui();
}


function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xa0a0a0 );
   // scene.fog = new THREE.Fog( 0xa0a0a0, 200, 1000 );
}

function initLight() {
    scene.add(new THREE.AmbientLight(0x444444));

}
function initMoldel() {

    // 地板
    var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0xffffff, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    //添加地板割线
    var grid = new THREE.GridHelper( 2000, 20, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );

    var loader = new THREE.JDLoader();
    loader.load("fbx/t5.JD",
        function (data)
        {
            console.log(data);
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
                        var animationsBegin = datGui.addFolder("beginAction");//guiFolder
                        var animationsStop = datGui.addFolder('stopAction');
                        //在一个物体中的多个动画播放
                        for(var j=0;mesh.geometry.animations[j];j++)
                        {
                            createActionBegin(j);
                            createActionStop(j);
                        }
                        function createActionBegin(i){

                            actions[i] = mixer.clipAction(mesh.geometry.animations[i]);
                            gui["action"+i] = function () {
                                for(var j=0; j<actions.length; j++){
                                    if(j === i){
                                        actions[j].play();
                                    }
                                }
                            };
                            animationsBegin.add(gui, "action"+i);
                        }
                        function createActionStop(i) {

                            var stopGui=[];
                            stopGui["action"+i]=function () {
                                for(var j=0;j<actions.length;j++){
                                    if(j===i){
                                        actions[i].stop();
                                    }
                                }
                            }
                            animationsStop.add(stopGui,"action"+i);

                        }
                    }
                }
                else if (data.objects[i].type == "Line")
                {
                    var jd_color = data.objects[i].jd_object.color;
                    var color1 = new THREE.Color( jd_color[0] / 255, jd_color[1] / 255, jd_color[2] / 255 );
                    var material = new THREE.LineBasicMaterial({ color: color1}); //{ color: new THREE.Color( 0xff0000 ) }
                    var line = new THREE.Line(data.objects[i].geometry, material);
                    scene.add(line);

                    if (line.geometry.animations)
                    {
                        var mixer = new THREE.AnimationMixer(line);
                        mixers.push(mixer);
                        var action = mixer.clipAction(line.geometry.animations[0]);
                        action.play();
                    }
                }
            }
            initCamara(data.boundingSphere);
            initContrls(data.boundingSphere);

        });

}
function initRender() {
    var container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
}
function initGui() {
    gui={};
    datGui = new dat.GUI();
    //将设置属性添加到gui当中，gui.add(对象，属性，最小值，最大值）
}
function initCamara(boundingSphere) {
    var near = 1, far = 100 * boundingSphere.radius;
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, near, far);
    camera.position.z = boundingSphere.center.z + 2.5 * boundingSphere.radius;
    camera.lookAt(boundingSphere.center);
    camera.add(new THREE.DirectionalLight(0xFFFFFF, 1));
    scene.add(camera);

}
function initContrls(boundingSphere) {
    if (!controls)
        controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.copy(boundingSphere.center);
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