// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 6000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene, renderer.domElement);

var vectorFromVertex = function(v) {
  return new THREE.Vector3(v[0], v[1], v[2]);
};
var vectorsFromVertices = function(vs) {
  return vs.map(vectorFromVertex);
};
var objects = [];
var focus = "*";
var xRange = [6000, -6000];
var withinBounds = function(object) {
  var inputs = [].map.call(
    document.querySelectorAll("#visibleRange input"),
    function(range) {
      return range.value/100 * (xRange[1] - xRange[0]) + xRange[0];
    });
  var xRestriction = inputs.slice(0,2);
  var p = object.position, x = p.x, y = p.y, z = p.z;
  return x >= xRestriction[0] && x <= xRestriction[1];
};
var renderFocus = function() {
  objects.forEach(function(object) {
    var name = object.name;
    if( !withinBounds(object) ) {
      scene.getObjectByName(name).visible = false;
    } else if( name == focus || focus == "*" ) {
      scene.getObjectByName(name).visible = true;
      scene.getObjectByName(name).material = new THREE.MeshNormalMaterial();
    } else {
      scene.getObjectByName(name).visible = true;
      scene.getObjectByName(name).material = new THREE.MeshBasicMaterial({
	color: 0xc4c4c4, wireframe: true, wireframe_linewidth: 10
      });
    }
  });
};
var listenForObjectSelect = function() {
  [].forEach.call(
    document.querySelectorAll("#objects a"),
    function(a) {
      a.addEventListener("click", function(evt) {
        focus = a.innerText;
        evt.preventDefault();
	renderFocus();
      });
    });
};
var renderObjects = function(objects) {
  var wrapper = document.getElementById("objects");
  wrapper.innerHTML = "";
  var ul = document.createElement("ul");
  var span = document.createElement("span");
  span.innerText = "Select an object";
  wrapper.appendChild(span);
  objects.map(function(o) {
    return o.name;
  }).concat(["*"]).map(function(n) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.innerText = n;
    a.href = "#";
    li.appendChild(a);
    return li;
  }).forEach(function(li) {
    ul.appendChild(li);
  });
  wrapper.appendChild(ul);
  listenForObjectSelect();
};
var renderSTL = function(triangles, name) {
  var geo = new THREE.Geometry();
  var allVs = [];
  triangles.forEach(function(triangle, i) {
    var vs = vectorsFromVertices(triangle.vertices);
    [].push.apply(allVs, vs);
    [].push.apply(geo.vertices, vs);
    geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2));
  });
  geo.computeFaceNormals();
  var object = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
  object.name = name;
  object.overdraw = true;
  object.position.x = 0;
  object.position.y = 0;
  object.position.z = 0;
  scene.add(object);

  var center = allVs.reduce(function(a, x) {
    return a.add(x);
  }, new THREE.Vector3(0,0,0)).multiplyScalar(1/allVs.length);

  // update max and min
  xRange[0] = xRange[0] < center.x ? xRange[0] : center.x;
  xRange[1] = xRange[1] > center.x ? xRange[1] : center.x;

  objects.push({ name: name, position: center });
  renderObjects(objects);
};
var handleSTL = function(evt) {
  [].forEach.call(evt.target.files, function(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var bytes = new Uint8Array(e.target.result);
      var triangles = parse(bytes).data;
      renderSTL(triangles, file.name);
    };
    reader.readAsArrayBuffer(file);
  });
};
document.getElementById('files').addEventListener('change', handleSTL, false);
[].forEach.call(
  document.querySelectorAll("#visibleRange input"),
  function(range) {
    range.addEventListener("input", renderFocus);
    range.addEventListener("change", renderFocus);
  });

controls.render();

