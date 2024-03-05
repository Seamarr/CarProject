// Adapted from https://webglfundamentals.org/webgl/lessons/webgl-load-obj-w-mtl.html

import { defs, tiny } from "./examples/common.js";

const {
  Vector,
  Vector3,
  Vector4,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Scene,
  Texture,
} = tiny;

export class Custom_Shader extends Shader {
  // **Phong_Shader** is a subclass of Shader, which stores and manages a GPU program.
  // Graphic cards prior to year 2000 had shaders like this one hard-coded into them
  // instead of customizable shaders.  "Phong-Blinn" Shading here is a process of
  // determining brightness of pixels via vector math.  It compares the normal vector
  // at that pixel with the vectors toward the camera and light sources.

  constructor(num_lights = 1) {
    super();
    this.num_lights = num_lights;
  }

  shared_glsl_code() {
    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    return (
      ` precision mediump float;
            const int N_LIGHTS = ` +
      this.num_lights +
      `;
            uniform float ambient, diffusivity, specularity, smoothness;
            uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
            uniform float light_attenuation_factors[N_LIGHTS];
            uniform vec4 shape_color;
            uniform vec3 squared_scale, camera_center;
    
            // Specifier "varying" means a variable's final value will be passed from the vertex shader
            // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
            varying vec3 N, vertex_worldspace;
            // ***** PHONG SHADING HAPPENS HERE: *****                                       
            vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
                // phong_model_lights():  Add up the lights' contributions.
                vec3 E = normalize( camera_center - vertex_worldspace );
                vec3 result = vec3( 0.0 );
                for(int i = 0; i < N_LIGHTS; i++){
                    // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                    // light will appear directional (uniform direction from all points), and we 
                    // simply obtain a vector towards the light by directly using the stored value.
                    // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                    // the point light's location from the current surface point.  In either case, 
                    // fade (attenuate) the light as the vector needed to reach it gets longer.  
                    vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                                   light_positions_or_vectors[i].w * vertex_worldspace;                                             
                    float distance_to_light = length( surface_to_light_vector );
    
                    vec3 L = normalize( surface_to_light_vector );
                    vec3 H = normalize( L + E );
                    // Compute the diffuse and specular components from the Phong
                    // Reflection Model, using Blinn's "halfway vector" method:
                    float diffuse  =      max( dot( N, L ), 0.0 );
                    float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                    float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                    
                    vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                              + light_colors[i].xyz * specularity * specular;
                    result += attenuation * light_contribution;
                  }
                return result;
              } `
    );
  }

  vertex_glsl_code() {
    // ********* VERTEX SHADER *********
    return (
      this.shared_glsl_code() +
      `
            varying vec2 f_tex_coord;
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            attribute vec2 texture_coord;
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                // Turn the per-vertex texture coordinate into an interpolated variable.
                f_tex_coord = texture_coord;
              } `
    );
  }

  fragment_glsl_code() {
    // ********* FRAGMENT SHADER *********
    // A fragment is a pixel that's overlapped by the current triangle.
    // Fragments affect the final image or get discarded due to depth.
    return (
      this.shared_glsl_code() +
      `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
    
            void main(){
                // Sample the texture image in the correct place:
                vec4 tex_color = texture2D( texture, f_tex_coord );
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
              } `
    );
  }

  send_material(gl, gpu, material) {
    // send_material(): Send the desired shape-wide material qualities to the
    // graphics card, where they will tweak the Phong lighting formula.
    gl.uniform4fv(gpu.shape_color, material.color);
    gl.uniform1f(gpu.ambient, material.ambient);
    gl.uniform1f(gpu.diffusivity, material.diffusivity);
    gl.uniform1f(gpu.specularity, material.specularity);
    gl.uniform1f(gpu.smoothness, material.smoothness);
  }

  send_gpu_state(gl, gpu, gpu_state, model_transform) {
    // send_gpu_state():  Send the state of our whole drawing context to the GPU.
    const O = vec4(0, 0, 0, 1),
      camera_center = gpu_state.camera_transform.times(O).to3();
    gl.uniform3fv(gpu.camera_center, camera_center);
    // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
    const squared_scale = model_transform
      .reduce((acc, r) => {
        return acc.plus(vec4(...r).times_pairwise(r));
      }, vec4(0, 0, 0, 0))
      .to3();
    gl.uniform3fv(gpu.squared_scale, squared_scale);
    // Send the current matrices to the shader.  Go ahead and pre-compute
    // the products we'll need of the of the three special matrices and just
    // cache and send those.  They will be the same throughout this draw
    // call, and thus across each instance of the vertex shader.
    // Transpose them since the GPU expects matrices as column-major arrays.
    const PCM = gpu_state.projection_transform
      .times(gpu_state.camera_inverse)
      .times(model_transform);
    gl.uniformMatrix4fv(
      gpu.model_transform,
      false,
      Matrix.flatten_2D_to_1D(model_transform.transposed())
    );
    gl.uniformMatrix4fv(
      gpu.projection_camera_model_transform,
      false,
      Matrix.flatten_2D_to_1D(PCM.transposed())
    );

    // Omitting lights will show only the material color, scaled by the ambient term:
    if (!gpu_state.lights.length) return;

    const light_positions_flattened = [],
      light_colors_flattened = [];
    for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
      light_positions_flattened.push(
        gpu_state.lights[Math.floor(i / 4)].position[i % 4]
      );
      light_colors_flattened.push(
        gpu_state.lights[Math.floor(i / 4)].color[i % 4]
      );
    }
    gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
    gl.uniform4fv(gpu.light_colors, light_colors_flattened);
    gl.uniform1fv(
      gpu.light_attenuation_factors,
      gpu_state.lights.map((l) => l.attenuation)
    );
  }

  update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
    // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
    // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
    // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
    // program (which we call the "Program_State").  Send both a material and a program state to the shaders
    // within this function, one data field at a time, to fully initialize the shader for a draw.

    // Fill in any missing fields in the Material object with custom defaults for this shader:
    const defaults = {
      color: color(0, 0, 0, 1),
      ambient: 0,
      diffusivity: 1,
      specularity: 1,
      smoothness: 40,
    };
    material = Object.assign({}, defaults, material);

    this.send_material(context, gpu_addresses, material);
    this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);

    if (material.texture && material.texture.ready) {
      // Select texture unit 0 for the fragment shader Sampler2D uniform called "texture":
      context.uniform1i(gpu_addresses.texture, 0);
      // For this draw, use the texture image from correct the GPU buffer:
      material.texture.activate(context);
    }
  }
}

export class Mesh extends Shape {
  constructor(position, normal, texture_coord, indices) {
    super("position", "normal", "texture_coord");
    // Begin downloading the mesh. Once that completes, return
    // control to our parse_into_mesh function.
    this.arrays.position = [];
    this.arrays.normal = [];
    this.arrays.texture_coord = [];
    this.indices = indices || {};

    for (var j = 0; j < position.length / 3; j++) {
      this.arrays.position.push(
        vec3(position[3 * j], position[3 * j + 1], position[3 * j + 2])
      );
      this.arrays.normal.push(
        vec3(normal[3 * j], normal[3 * j + 1], normal[3 * j + 2])
      );
      this.arrays.texture_coord.push(
        vec(texture_coord[2 * j], texture_coord[2 * j + 1])
      );
    }

    //this.copy_onto_graphics_card(this.gl);
  }

  draw(context, program_state, model_transform, material) {
    // draw(): Same as always for shapes, but cancel all
    // attempts to draw the shape before it loads:
    super.draw(context, program_state, model_transform, material);
  }
}

function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];
  const objColors = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [objPositions, objTexcoords, objNormals, objColors];

  // same order as `f` indices
  let webglVertexData = [
    [], // positions
    [], // texcoords
    [], // normals
    [], // colors
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ["default"];
  let material = "default";
  let object = "default";

  const noop = () => {};

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      const color = [];
      webglVertexData = [position, texcoord, normal, color];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
          color,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split("/");
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
      // if this is the position index (index 0) and we parsed
      // vertex colors then copy the vertex colors to the webgl vertex color data
      if (i === 0 && objColors.length > 1) {
        geometry.data.color.push(...objColors[index]);
      }
    });
  }

  const keywords = {
    v(parts) {
      // if there are more than 3 values here they are vertex colors
      if (parts.length > 3) {
        objPositions.push(parts.slice(0, 3).map(parseFloat));
        objColors.push(parts.slice(3).map(parseFloat));
      } else {
        objPositions.push(parts.map(parseFloat));
      }
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop, // smoothing group
    mtllib(parts, unparsedArgs) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split("\n");
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn("unhandled keyword:", keyword); // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
      Object.entries(geometry.data).filter(([, array]) => array.length > 0)
    );
  }

  return {
    geometries,
    materialLibs,
  };
}

function parseMapArgs(unparsedArgs) {
  // TODO: handle options
  return unparsedArgs;
}

function parseMTL(text) {
  const materials = {};
  let material;

  const keywords = {
    newmtl(parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },
    /* eslint brace-style:0 */
    Ns(parts) {
      material.shininess = parseFloat(parts[0]);
    },
    Ka(parts) {
      material.ambient = parts.map(parseFloat);
    },
    Kd(parts) {
      material.diffuse = parts.map(parseFloat);
    },
    Ks(parts) {
      material.specular = parts.map(parseFloat);
    },
    Ke(parts) {
      material.emissive = parts.map(parseFloat);
    },
    map_Kd(parts, unparsedArgs) {
      material.diffuseMap = parseMapArgs(unparsedArgs);
    },
    map_Ns(parts, unparsedArgs) {
      material.specularMap = parseMapArgs(unparsedArgs);
    },
    map_Bump(parts, unparsedArgs) {
      material.normalMap = parseMapArgs(unparsedArgs);
    },
    Ni(parts) {
      material.opticalDensity = parseFloat(parts[0]);
    },
    d(parts) {
      material.opacity = parseFloat(parts[0]);
    },
    illum(parts) {
      material.illum = parseInt(parts[0]);
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split("\n");
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn("unhandled keyword:", keyword); // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return materials;
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function create1PixelTexture(gl, pixel) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(pixel)
  );
  return texture;
}

function createTexture(gl, url) {
  const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
  // Asynchronously load an image
  const image = new Image();
  requestCORSIfNotSameOrigin(image, url);
  image.src = url;
  image.addEventListener("load", function () {
    // Now that the image has loaded make copy it to the texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Check if the image is a power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  });
  return texture;
}

function makeIndexIterator(indices) {
  let ndx = 0;
  const fn = () => indices[ndx++];
  fn.reset = () => {
    ndx = 0;
  };
  fn.numElements = indices.length;
  return fn;
}

function makeUnindexedIterator(positions) {
  let ndx = 0;
  const fn = () => ndx++;
  fn.reset = () => {
    ndx = 0;
  };
  fn.numElements = positions.length / 3;
  return fn;
}

function subtractVector2(a, b) {
  return a.map((v, ndx) => v - b[ndx]);
}

function subtractVectors(a, b) {
  const newVec = [0, 0, 0];
  newVec[0] = a[0] - b[0];
  newVec[1] = a[1] - b[1];
  newVec[2] = a[2] - b[2];
  return newVec;
}

function normalize(v) {
  const newVec = [0, 0, 0];
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    newVec[0] = v[0] / length;
    newVec[1] = v[1] / length;
    newVec[2] = v[2] / length;
  }
  return newVec;
}

function scaleVector(v, s) {
  const newVec = [0, 0, 0];
  newVec[0] = v[0] * s;
  newVec[1] = v[1] * s;
  newVec[2] = v[2] * s;
  return newVec;
}

function generateTangents(position, texcoord, indices) {
  const getNextIndex = indices
    ? makeIndexIterator(indices)
    : makeUnindexedIterator(position);
  const numFaceVerts = getNextIndex.numElements;
  const numFaces = numFaceVerts / 3;

  const tangents = [];
  for (let i = 0; i < numFaces; ++i) {
    const n1 = getNextIndex();
    const n2 = getNextIndex();
    const n3 = getNextIndex();

    const p1 = position.slice(n1 * 3, n1 * 3 + 3);
    const p2 = position.slice(n2 * 3, n2 * 3 + 3);
    const p3 = position.slice(n3 * 3, n3 * 3 + 3);

    const uv1 = texcoord.slice(n1 * 2, n1 * 2 + 2);
    const uv2 = texcoord.slice(n2 * 2, n2 * 2 + 2);
    const uv3 = texcoord.slice(n3 * 2, n3 * 2 + 2);

    const dp12 = subtractVectors(p2, p1);
    const dp13 = subtractVectors(p3, p1);

    const duv12 = subtractVector2(uv2, uv1);
    const duv13 = subtractVector2(uv3, uv1);

    const f = 1.0 / (duv12[0] * duv13[1] - duv13[0] * duv12[1]);
    const tangent = Number.isFinite(f)
      ? normalize(
          scaleVector(
            subtractVectors(
              scaleVector(dp12, duv13[1]),
              scaleVector(dp13, duv12[1])
            ),
            f
          )
        )
      : [1, 0, 0];

    tangents.push(...tangent, ...tangent, ...tangent);
  }

  return tangents;
}

export class Shapes_From_File {
  // **Shape_From_File** is a versatile standalone Shape that imports
  // all its arrays' data from an .obj 3D model file.
  constructor(filename) {
    this.load_file(filename).then(() => {
      this.ready = true;
    });
  }

  async load_file(filename) {
    // Request the external file and wait for it to load.
    // Failure mode:  Loads an empty shape.
    const response = await fetch(filename);
    const text = await response.text();
    const obj = parseOBJ(text);
    console.log(obj);
    const baseHref = new URL(filename, window.location.href);
    const matTexts = await Promise.all(
      obj.materialLibs.map(async (filename) => {
        const matHref = new URL(filename, baseHref).href;
        const response = await fetch(matHref);
        return await response.text();
      })
    );
    const materials = parseMTL(matTexts.join("\n"));

    const textures = {
      /*       defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
      defaultNormal: create1PixelTexture(gl, [127, 127, 255, 0]),
 */
    };

    // load texture for materials
    for (const material of Object.values(materials)) {
      Object.entries(material)
        .filter(([key]) => key.endsWith("Map"))
        .forEach(([key, filename]) => {
          let texture = textures[filename];
          if (!texture) {
            const textureHref = new URL(filename, baseHref).href;
            texture = new Texture(textureHref);
          }
          material["texture"] = texture;
        });
    }

    // hack the materials so we can see the specular map
    Object.values(materials).forEach((m) => {
      m.shininess = 25;
      m.specular = [3, 2, 1];
    });

    const defaultMaterial = {
      shader: new Custom_Shader(1),
      color: color(0, 0, 0, 1),
      ambient: 0.1,
      diffusivity: 0.1,
      specularity: 1,
    };
    /*     {
      diffuse: [1, 1, 1],
      diffuseMap: textures.defaultWhite,
      normalMap: textures.defaultNormal,
      ambient: [0, 0, 0],
      specular: [1, 1, 1],
      specularMap: textures.defaultWhite,
      shininess: 400,
      opacity: 1,
    };
 */
    this.parts = obj.geometries.map(({ material, data }) => {
      // Because data is just named arrays like this
      //
      // {
      //   position: [...],
      //   texcoord: [...],
      //   normal: [...],
      // }
      //
      // and because those names match the attributes in our vertex
      // shader we can pass it directly into `createBufferInfoFromArrays`
      // from the article "less code more fun".
      let part_color = color(1, 1, 1, 1);
      if (data.color) {
        if (data.position.length === data.color.length) {
          // it's 3. The our helper library assumes 4 so we need
          // to tell it there are only 3.
          data.color = color(color[0], color[1], color[2], 1);
        }
      }

      // generate tangents if we have the data to do so.
      if (data.texcoord && data.normal) {
        data.tangent = generateTangents(data.position, data.texcoord);
      } else {
        // There are no tangents
        data.tangent = { value: [1, 0, 0] };
      }

      if (!data.texcoord) {
        data.texcoord = { value: [0, 0] };
      }

      if (!data.normal) {
        // we probably want to generate normals if there are none
        data.normal = { value: [0, 0, 1] };
      }

      // create a buffer for each array by calling
      // gl.createBuffer, gl.bindBuffer, gl.bufferData

      const { shader, ...defaults } = defaultMaterial;


      return {
        material: new Material(shader, {
          ...defaults,
          color:
            materials[material] && "diffuse" in materials[material]
              ? color(
                  materials[material]["diffuse"][0],
                  materials[material]["diffuse"][1],
                  materials[material]["diffuse"][2],
                  1
                )
              : part_color,
          texture:
            materials[material] && "texture" in materials[material]
              ? materials[material]["texture"]
              : undefined,
        }),
        shape: new Mesh(
          data.position,
          data.normal,
          data.texcoord,
          data.indices
        ),
      };
    });
  }

  draw(context, program_state, model_transform) {
    // draw(): Same as always for shapes, but cancel all
    // attempts to draw the shape before it loads:
    if (this.ready)
      this.parts.forEach((part) =>
        part.shape.draw(context, program_state, model_transform, part.material)
      );
  }
}