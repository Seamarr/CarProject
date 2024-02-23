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

    // Movement state
    this.car_position = vec3(0, 0, 0); // Use a vector to represent position
    this.car_velocity = vec3(0, 0, 0); // Velocity vector
    this.car_acceleration = vec3(0, 0, 0); // Acceleration vector

    // Constants
    this.max_speed = 10;
    this.acceleration_rate = 12;
    this.deceleration_rate = 5;
    this.tilt_angle = 0;

    this.current_tilt = 0;
    this.target_tilt = 0;
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button(
      "Move Left",
      ["ArrowLeft"],
      () => {
        this.car_acceleration[0] = -this.acceleration_rate;
        this.target_tilt = Math.PI / 2; // Set to desired tilt angle for left turn
        this.tilt_angle = -7;
      },
      undefined,
      () => {
        this.car_acceleration[0] = 0;
        this.target_tilt = 0; // Reset to no tilt when key is released
        this.tilt_angle = 0;
      }
    );
    this.key_triggered_button(
      "Move Right",
      ["ArrowRight"],
      () => {
        this.car_acceleration[0] = this.acceleration_rate;
        this.target_tilt = -Math.PI / 2; // Set to desired tilt angle for right turn
        this.tilt_angle = 7;
      },
      undefined,
      () => {
        this.car_acceleration[0] = 0;
        this.target_tilt = 0; // Reset to no tilt when key is released
        this.tilt_angle = 0;
      }
    );
  }

  update_state(dt) {
    // Update velocity based on acceleration
    this.car_velocity = this.car_velocity.plus(this.car_acceleration.times(dt));

    // Clamp velocity to the max speed
    this.car_velocity[0] = Math.max(
      Math.min(this.car_velocity[0], this.max_speed),
      -this.max_speed
    );

    // Update position based on velocity
    this.car_position = this.car_position.plus(this.car_velocity.times(dt));

    //console.log(this.current_tilt);

    // Determine and update the tilt based on acceleration or velocity
    const tiltIntensity = -Math.PI / 36; // Adjust for desired tilt effect
    // Update target tilt based on direction
    this.target_tilt = this.tilt_angle * tiltIntensity;

    // Smoothly interpolate current tilt towards target tilt
    this.current_tilt += (this.target_tilt - this.current_tilt) * dt * 5; // Adjust the 5 for faster or slower interpolation

    // Combine translation and rotation in the car's transformation
    this.car_transform = Mat4.translation(...this.car_position).times(
      Mat4.rotation(this.current_tilt, 0, 1, 0)
    ); // Rotation around the Y-axis for tilt

    const road_left_bound = -10; // Left boundary of the road
    const road_right_bound = 10; // Right boundary of the road

    // Check if the car is within the bounds after updating its position
    if (this.car_position[0] < road_left_bound) {
      this.car_position[0] = road_left_bound; // Reset to left bound
      this.car_velocity[0] = 0; // Stop the car's lateral movement
    } else if (this.car_position[0] > road_right_bound) {
      this.car_position[0] = road_right_bound; // Reset to right bound
      this.car_velocity[0] = 0; // Stop the car's lateral movement
    }

    // Deceleration logic (when no keys are pressed)
    if (
      this.car_acceleration.equals(vec3(0, 0, 0)) &&
      !this.car_velocity.equals(vec3(0, 0, 0))
    ) {
      const deceleration = this.deceleration_rate * dt;
      this.car_velocity[0] =
        this.car_velocity[0] > 0
          ? Math.max(0, this.car_velocity[0] - deceleration)
          : Math.min(0, this.car_velocity[0] + deceleration);
    }
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

    const t = program_state.animation_time / 1000;
    const dt = program_state.animation_delta_time / 1000;
    this.update_state(dt);

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
