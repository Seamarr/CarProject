import { tiny, defs } from "./objects.js";
import { Shape_From_File } from "./examples/obj-file-demo.js";

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
  Texture,
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
      car: new Shape_From_File("assets/10600_RC_ Car_SG_v2_L3.obj"),
    };

    // *** Materials
    this.materials = {
      test: new Material(new defs.Phong_Shader(), {
        ambient: 0.4,
        diffusivity: 0.6,
        color: hex_color("#ffffff"),
      }),
      car: new Material(new defs.Textured_Phong(), {
        color: color(0.5, 0.5, 0.5, 1),
        ambient: 0.3,
        diffusivity: 0.5,
        specularity: 0.5,
        texture: new Texture("assets/stars.png"),
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

    // Physics Constants
    this.max_speed = 10;

    this.car_mass = 9;
    this.coefficient_of_friction = 0.2;
    this.applied_force = 50;
    this.braking_force = 1;
    this.friction_force = this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity

    this.total_acceleration_force = this.applied_force - this.friction_force;
    this.total_deceleration_force = this.braking_force + this.friction_force;

    this.acceleration_rate = this.total_acceleration_force / this.car_mass;
    this.deceleration_rate = this.total_deceleration_force / this.car_mass;

    if (this.acceleration_rate < 0) {
      this.acceleration_rate = 0;
    }

    console.log(this.acceleration_rate);

    this.tilt_angle = 0;
    this.current_tilt = 0;
    this.target_tilt = 0;
  }

  calculateAcceleration(force, mass) {}

  make_control_panel() {
    this.control_panel.innerHTML +=
      "Click and drag the scene to spin your viewpoint around it.<br>";
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button(
      "Move Left",
      ["ArrowLeft"],
      () => {
        this.car_acceleration[0] = -this.acceleration_rate;
        this.target_tilt = Math.PI / 2; // Set to desired tilt angle for left turn
        this.tilt_angle = -5;
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
        this.tilt_angle = 5;
      },
      undefined,
      () => {
        this.car_acceleration[0] = 0;
        this.target_tilt = 0; // Reset to no tilt when key is released
        this.tilt_angle = 0;
      }
    );
    this.new_line();
    this.key_triggered_button(
      "Move Left",
      ["a"],
      () => {
        this.car_acceleration[0] = -this.acceleration_rate;
        this.target_tilt = Math.PI / 2; // Set to desired tilt angle for left turn
        this.tilt_angle = -5;
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
      ["d"],
      () => {
        this.car_acceleration[0] = this.acceleration_rate;
        this.target_tilt = -Math.PI / 2; // Set to desired tilt angle for right turn
        this.tilt_angle = 5;
      },
      undefined,
      () => {
        this.car_acceleration[0] = 0;
        this.target_tilt = 0; // Reset to no tilt when key is released
        this.tilt_angle = 0;
      }
    );
    this.new_line();
    const mass_controls = this.control_panel.appendChild(
      document.createElement("span")
    );
    mass_controls.style.margin = "30px";
    this.key_triggered_button(
      "-",
      ["o"],
      () => {
        this.car_mass /= 1.2;
        this.friction_force =
          this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity
        this.acceleration_rate = this.total_acceleration_force / this.car_mass;
        this.deceleration_rate = this.total_deceleration_force / this.car_mass;
        if (this.acceleration_rate < 0) {
          this.acceleration_rate = 0;
        }
      },
      undefined,
      undefined,
      undefined,
      mass_controls
    );
    this.live_string((car) => {
      car.textContent = "Mass(kg): " + this.car_mass.toFixed(2);
    }, mass_controls);
    this.key_triggered_button(
      "+",
      ["p"],
      () => {
        this.car_mass *= 1.2;
        this.friction_force =
          this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity
        this.acceleration_rate = this.total_acceleration_force / this.car_mass;
        this.deceleration_rate = this.total_deceleration_force / this.car_mass;
        if (this.acceleration_rate < 0) {
          this.acceleration_rate = 0;
        }
      },
      undefined,
      undefined,
      undefined,
      mass_controls
    );
    this.new_line();
    const applied_force_controls = this.control_panel.appendChild(
      document.createElement("span")
    );
    applied_force_controls.style.margin = "30px";
    this.key_triggered_button(
      "-",
      ["k"],
      () => {
        this.applied_force /= 1.2;
        this.total_acceleration_force =
          this.applied_force - this.friction_force;
        this.acceleration_rate = this.total_acceleration_force / this.car_mass;
        if (this.acceleration_rate < 0) {
          this.acceleration_rate = 0;
        }
      },
      undefined,
      undefined,
      undefined,
      applied_force_controls
    );
    this.live_string((car) => {
      car.textContent =
        "Applied Force(Newtons): " + this.applied_force.toFixed(2);
    }, applied_force_controls);
    this.key_triggered_button(
      "+",
      ["l"],
      () => {
        this.applied_force *= 1.2;
        this.total_acceleration_force =
          this.applied_force - this.friction_force;
        this.acceleration_rate = this.total_acceleration_force / this.car_mass;
        if (this.acceleration_rate < 0) {
          this.acceleration_rate = 0;
        }
      },
      undefined,
      undefined,
      undefined,
      applied_force_controls
    );
    this.new_line();
    const braking_force_controls = this.control_panel.appendChild(
      document.createElement("span")
    );
    braking_force_controls.style.margin = "30px";
    this.key_triggered_button(
      "-",
      ["h"],
      () => {
        this.braking_force /= 1.2;
        this.total_deceleration_force =
          this.braking_force + this.friction_force;
        this.deceleration_rate = this.total_deceleration_force / this.car_mass;
      },
      undefined,
      undefined,
      undefined,
      braking_force_controls
    );
    this.live_string((car) => {
      car.textContent =
        "Braking Force(Newtons): " + this.braking_force.toFixed(2);
    }, braking_force_controls);
    this.key_triggered_button(
      "+",
      ["j"],
      () => {
        this.braking_force *= 1.2;
        this.total_deceleration_force =
          this.braking_force + this.friction_force;
        this.deceleration_rate = this.total_deceleration_force / this.car_mass;
      },
      undefined,
      undefined,
      undefined,
      braking_force_controls
    );
    this.new_line();
    const coefficient_of_friction_controls = this.control_panel.appendChild(
      document.createElement("span")
    );
    coefficient_of_friction_controls.style.margin = "30px";
    this.key_triggered_button(
      "-",
      ["u"],
      () => {
        this.coefficient_of_friction -= 0.05;
        if (this.coefficient_of_friction < 0) {
          this.coefficient_of_friction = 0;
        }
        this.friction_force =
          this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity
        this.total_acceleration_force =
          this.applied_force - this.friction_force;
        this.total_deceleration_force =
          this.braking_force + this.friction_force;

        this.acceleration_rate = this.total_acceleration_force / this.car_mass;
        this.deceleration_rate = this.total_deceleration_force / this.car_mass;

        if (this.acceleration_rate < 0) {
          this.acceleration_rate = 0;
        }
      },
      undefined,
      undefined,
      undefined,
      coefficient_of_friction_controls
    );
    this.live_string((car) => {
      car.textContent =
        "Coefficient of Friction: " + this.coefficient_of_friction.toFixed(2);
    }, coefficient_of_friction_controls);
    this.key_triggered_button(
      "+",
      ["i"],
      () => {
        this.coefficient_of_friction += 0.05;
        if (this.coefficient_of_friction > 1.0) {
          this.coefficient_of_friction = 1.0;
        }
        this.friction_force =
          this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity
        this.total_acceleration_force =
          this.applied_force - this.friction_force;
        this.total_deceleration_force =
          this.braking_force + this.friction_force;

        this.acceleration_rate = this.total_acceleration_force / this.car_mass;
        this.deceleration_rate = this.total_deceleration_force / this.car_mass;

        if (this.acceleration_rate < 0) {
          this.acceleration_rate = 0;
        }
      },
      undefined,
      undefined,
      undefined,
      coefficient_of_friction_controls
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
        .times(Mat4.translation(0, 0.4, 0))
        .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
        .times(Mat4.rotation(Math.PI, 0, 1, 0))
        .times(Mat4.scale(2, 2, 2))
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
    if (this.car_acceleration[0] == 0 && !this.car_velocity[0] == 0) {
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

    this.shapes.car.draw(
      context,
      program_state,
      this.car_transform,
      this.materials.car
    );
  }
}
