import { tiny, defs } from "./objects.js";

const {
  Vector,
  Vector3,
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
} = tiny;

export class CarGame extends Scene {
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();

    // At the beginning of our program, load one of each of these shape definitions onto the GPU.
    this.shapes = {
      torus: new defs.Torus(15, 15),
      torus2: new defs.Torus(3, 15),
      sphere: new defs.Subdivision_Sphere(4),
      circle: new defs.Regular_2D_Polygon(1, 15),
      box: new defs.Box(2, 1, 4),
      road: new defs.Box(20, 0.1, 500),
    };

    // *** Materials
    this.materials = {
      test: new Material(new defs.Phong_Shader(), {
        ambient: 0.4,
        diffusivity: 0.6,
        color: hex_color("#ffffff"),
      }),
      car: new Material(new defs.Phong_Shader(), {
        color: hex_color("#ff0000"),
        ambient: 1,
      }),
      road: new Material(new defs.Phong_Shader(), {
        color: hex_color("#D3D3D3"),
        ambient: 1,
      }),
    };

    this.initial_camera_location = Mat4.look_at(
      vec3(0, 5, 20),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );

    this.car_transform = Mat4.identity();
    this.road_transform = Mat4.identity();
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button(
      "Move right",
      ["Control", "D"],
      () => (this.attached = () => null)
    );
    this.new_line();
  }

  display(context, program_state) {
    // display():  Called once per frame of animation.
    // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
    if (!context.scratchpad.controls) {
      this.children.push(
        (context.scratchpad.controls = new defs.Movement_Controls())
      );
      // Define the global camera and projection matrices, which are stored in program_state.
      program_state.set_camera(this.initial_camera_location);
    }

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000
    );

    const light_position = vec4(0, 5, 5, 1);
    // The parameters of the Light are: position, color, size
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;
    const yellow = hex_color("#fac91a");
    let model_transform = Mat4.identity();

    const road_transform = this.road_transform.times(
      Mat4.translation(0, -0.5, 0)
    );

    this.shapes.road.draw(
      context,
      program_state,
      road_transform,
      this.materials.road
    );

    this.shapes.box.draw(
      context,
      program_state,
      this.car_transform,
      this.materials.car
    );
  }
}
