import { tiny, defs } from "./objects.js";
import { Shapes_From_File, Custom_Shader } from "./object_loader.js";

const { Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene, } = tiny;
const {Textured_Phong} = defs
export class CarGame extends Scene {
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();

    // At the beginning of our program, load one of each of these shape definitions onto the GPU.
    this.shapes = {
        box: new defs.Box(2, 1, 4),
        //road: new defs.Box(20, 0.1, 500),
        road: new defs.Cube(),
        rainbow_road: new defs.Cube(),
        grass: new defs.Cube(),
        tree: new defs.Box(5, 10, 3),
        leaves: new defs.Box(5, 5, 5),
        car: new Shapes_From_File("assets/Car.obj"),
        car2: new Shapes_From_File("assets/Car2.obj"),
        cone: new Shapes_From_File("assets/ConeFolder/objPylon.obj"),
        sky: new defs.Cube(),
        car3: new Shapes_From_File("assets/Car3.obj"),
        car4: new Shapes_From_File("assets/Car4.obj"),
        car5: new Shapes_From_File("assets/Car5.obj"),
        car6: new Shapes_From_File("assets/Car6.obj"),
        car7: new Shapes_From_File("assets/Car7.obj"),
    };

    this.shapes.grass.arrays.texture_coord.forEach(element => {
      element.scale_by(30)
  });

    this.shapes.rainbow_road.arrays.texture_coord.forEach(element => {
      element.scale_by(5)
  });

  this.shapes.sky.arrays.texture_coord.forEach(element => {
    element.scale_by(3)
});

    

    this.cars = [
        { car: new Shapes_From_File("assets/Car.obj") },
        { car: new Shapes_From_File("assets/Car2.obj") },
        { car: new Shapes_From_File("assets/Car3.obj") },
        { car: new Shapes_From_File("assets/Car4.obj") },
        { car: new Shapes_From_File("assets/Car5.obj") },
        { car: new Shapes_From_File("assets/Car6.obj") },
        { car: new Shapes_From_File("assets/Car7.obj") },
    ];

    this.randomCarNum = Math.round(Math.random() * 8);
    this.randomCarNum2 = Math.round(Math.random() * 8);
    this.randomCarNum3 = Math.round(Math.random() * 8);
    this.randomCarNum4 = Math.round(Math.random() * 8);

    // *** Materials
    this.materials = {
        car: new Material(new Custom_Shader(), {
            ambient: 1,
        }),
        road: new Material(new Textured_Phong(), {
            ambient: .5,
            texture: new Texture("assets/road_texture.png"),
            specularity: .1
        }),
        grass: new Material(new Textured_Phong(), {
          ambient: .5,
          texture: new Texture("assets/grass.png")
        }),
        tree: new Material(new defs.Phong_Shader(), {
            color: hex_color("#462500"),
            ambient: 1,
        }),
        leaves: new Material(new defs.Phong_Shader(), {
            color: hex_color("#00FF00"),
            ambient: 1,
        }),
        sky: new Material(new Textured_Phong(), {
          // color: hex_color("#87CEEB"),
          // ambient: .5,
          // specularity: 1,
          // diffusivity: 1
          ambient: 1,
          texture: new Texture("assets/cloudy_sky.jpeg")
        }),
        cone: new Material(new Custom_Shader(), {
          ambient: 1
        }),
        rainbow: new Material(new Textured_Phong(), {
          ambient: .5,
          texture: new Texture("assets/rainbow_road.png"),
          specularity: .7
        }),
        stars: new Material(new Textured_Phong(), {
          ambient: 1,
          texture: new Texture("assets/stars_.png")
        }),
        stars_still: new Material(new Textured_Phong(), {
          ambient: 1,
          texture: new Texture("assets/stars_.png")
        }),

    };

//    this.initial_camera_location = Mat4.look_at(
//      vec3(0, 5, 20),
//      vec3(0, 0, 0),
//      vec3(0, 1, 0)
 //   );
    this.initial_camera_location = Mat4.look_at(
        vec3(0, 9, 20), // eye position
        vec3(0, 0, -5), // at position
        vec3(0, 1, 0) // up direction
    );

    this.rainbow_road_flag = false;
    this.grass_flag = true;

    this.time_elapsed_1 = 0;
    this.time_elapsed_2 = 0;
    this.time_elapsed_3 = 0;

    this.car_transform = Mat4.identity();
    this.traffic_transform = [
        this.car_transform = Mat4.identity(),
        this.car_transform = Mat4.identity(),
        this.car_transform = Mat4.identity(),
    ];
    this.car2_transform = Mat4.identity();
    this.road_transform = Mat4.identity().times(Mat4.scale(10, 0.1, 300));
    this.grass_left_transform = Mat4.identity().times(Mat4.scale(100,0.1,300));
    this.grass_right_transform = Mat4.identity().times(Mat4.scale(100,0.1,300));
    this.sky_transform = Mat4.identity().times(Mat4.scale(1000, 1000, 1))
    this.tree_transform_1 = Mat4.identity();
    this.tree_transform_2 = Mat4.identity();
    this.cone_transform = Mat4.identity().times(Mat4.scale(1/6,1/6,1/6));

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

    this.collision_threshold = 2.5;
    this.collision_detected = false;

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
      () => { if (!this.collision_detected) {
          this.car_acceleration[0] = -this.acceleration_rate;
          this.target_tilt = Math.PI / 2; // Set to desired tilt angle for left turn
          this.tilt_angle = -5;
      }},
      undefined,
      () => { if (!this.collision_detected) {
          this.car_acceleration[0] = 0;
          this.target_tilt = 0; // Reset to no tilt when key is released
          this.tilt_angle = 0;
      }}
    );
    this.key_triggered_button(
      "Move Right",
      ["ArrowRight"],
      () => { if (!this.collision_detected) {
          this.car_acceleration[0] = this.acceleration_rate;
          this.target_tilt = -Math.PI / 2; // Set to desired tilt angle for right turn
          this.tilt_angle = 5;
      }},
      undefined,
      () => { if (!this.collision_detected) {
          this.car_acceleration[0] = 0;
          this.target_tilt = 0; // Reset to no tilt when key is released
          this.tilt_angle = 0;
      }}
    );
    this.new_line();
    this.key_triggered_button(
      "Move Left",
      ["a"],
      () => { if (!this.collision_detected) {
          this.car_acceleration[0] = -this.acceleration_rate;
          this.target_tilt = Math.PI / 2; // Set to desired tilt angle for left turn
          this.tilt_angle = -5;
      }},
      undefined,
      () => { if (!this.collision_detected) {
          this.car_acceleration[0] = 0;
          this.target_tilt = 0; // Reset to no tilt when key is released
          this.tilt_angle = 0;
      }}
    );
    this.key_triggered_button(
      "Move Right",
      ["d"],
      () => { if (!this.collision_detected) {
          this.car_acceleration[0] = this.acceleration_rate;
          this.target_tilt = -Math.PI / 2; // Set to desired tilt angle for right turn
          this.tilt_angle = 5;
      }},
      undefined,
      () => { if (!this.collision_detected) {
          this.car_acceleration[0] = 0;
          this.target_tilt = 0; // Reset to no tilt when key is released
          this.tilt_angle = 0;
      }}
    );
      this.key_triggered_button(
          "Restart Game",
          ["r"],
          () => { this.restart(); }
      );
    this.new_line();
    const mass_controls = this.control_panel.appendChild(
      document.createElement("span")
    );
    mass_controls.style.margin = "30px";
    this.key_triggered_button(
      "-",
      ["o"],
      () => { if (!this.collision_detected) {
          this.car_mass /= 1.2;
          this.friction_force =
              this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity
          this.acceleration_rate = this.total_acceleration_force / this.car_mass;
          this.deceleration_rate = this.total_deceleration_force / this.car_mass;
          if (this.acceleration_rate < 0) {
              this.acceleration_rate = 0;
          }
      }},
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
      () => { if (!this.collision_detected) {
          this.car_mass *= 1.2;
          this.friction_force =
              this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity
          this.acceleration_rate = this.total_acceleration_force / this.car_mass;
          this.deceleration_rate = this.total_deceleration_force / this.car_mass;
          if (this.acceleration_rate < 0) {
              this.acceleration_rate = 0;
          }
      }},
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
      () => { if (!this.collision_detected) {
          this.applied_force /= 1.2;
          this.total_acceleration_force =
              this.applied_force - this.friction_force;
          this.acceleration_rate = this.total_acceleration_force / this.car_mass;
          if (this.acceleration_rate < 0) {
              this.acceleration_rate = 0;
          }
      }},
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
      () => { if (!this.collision_detected) {
          this.applied_force *= 1.2;
          this.total_acceleration_force =
              this.applied_force - this.friction_force;
          this.acceleration_rate = this.total_acceleration_force / this.car_mass;
          if (this.acceleration_rate < 0) {
              this.acceleration_rate = 0;
          }
      }},
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
      () => { if (!this.collision_detected) {
          this.braking_force /= 1.2;
          this.total_deceleration_force =
              this.braking_force + this.friction_force;
          this.deceleration_rate = this.total_deceleration_force / this.car_mass;
      }},
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
      () => { if (!this.collision_detected) {
          this.braking_force *= 1.2;
          this.total_deceleration_force =
              this.braking_force + this.friction_force;
          this.deceleration_rate = this.total_deceleration_force / this.car_mass;
      }},
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
      () => { if (!this.collision_detected) {
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
      }},
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
      () => { if (!this.collision_detected) {
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
      }},
      undefined,
      undefined,
      undefined,
      coefficient_of_friction_controls
    );
    this.key_triggered_button(
      "Rainbow Road", ["r"] ,() => {
      this.rainbow_road_flag = true;
      this.grass_flag = false;
      }
    );
    this.key_triggered_button(
      "Grass Land", ["g"] ,() => {
      this.rainbow_road_flag = false;
      this.grass_flag = true;
      }
    );
  }

  generate_traffic(context, program_state, t) {
      if(!this.collision_detected) {
          const trafficZ = -200;
          //this.traffic_transform[i].car_transform = Mat4.translation(0, 0.6, -50).times(Mat4.scale(1.25, 1.25, 1.25)); middle lane
          //this.traffic_transform[i].car_transform = Mat4.translation(-5, 0.6, -50).times(Mat4.scale(1.25, 1.25, 1.25)); left lane
          //this.traffic_transform[i].car_transform = Mat4.translation(5, 0.6, -50).times(Mat4.scale(1.25, 1.25, 1.25)); right lane
          for(let i = 0; i < this.traffic_transform.length; i++) {
              this.traffic_transform[i].car_transform = Mat4.translation(5, 0.6, trafficZ).times(Mat4.scale(1.25, 1.25, 1.25));
          }

          if (
              5 * (t - this.time_elapsed_1) <=
              Math.abs(trafficZ) / this.acceleration_rate + 2
          ) {
              this.traffic_transform[1].car_transform = this.traffic_transform[1].car_transform.times(
                  Mat4.translation(
                      0,
                      0,
                      5 * this.acceleration_rate * (t - this.time_elapsed_1)
                  )
              );
          } else {
              this.time_elapsed_1 = t;
          }
      }

      this.cars[this.randomCarNum2].car.draw(
          context,
          program_state,
          this.traffic_transform[1].car_transform,
          this.materials.car
      );
  }

  checkCollision() {
      const car_pos = this.car_transform.times(vec4(0, 0, 0, 1)); //get a snapshot of the car position
      for (let i = 0; i < this.traffic_transform.length; i++) {
          const traffic_pos = this.traffic_transform[i].car_transform.times(vec4(0, 0, 0, 1));
          const distance = Math.sqrt(
              Math.pow(car_pos[0] - traffic_pos[0], 2) +
              Math.pow(car_pos[1] - traffic_pos[1], 2) +
              Math.pow(car_pos[2] - traffic_pos[2], 2)
          );
          if (distance < this.collision_threshold) {
              this.collision_detected = true;
              this.materials.road.shader.uniforms.stop_texture_update = 1; // Stop texture update
              this.materials.road.shader.uniforms.offset = 0;
              break;
          }
      }
  }

  restart() {
      this.time_elapsed_1 = 0;
      this.time_elapsed_2 = 0;
      this.time_elapsed_3 = 0;

      this.car_transform = Mat4.identity();
      this.traffic_transform = [
          this.car_transform = Mat4.identity(),
          this.car_transform = Mat4.identity(),
          this.car_transform = Mat4.identity(),
      ];
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

      this.collision_detected = false;

      this.tilt_angle = 0;
      this.current_tilt = 0;
      this.target_tilt = 0;

      this.materials.road.shader.uniforms.stop_update = 0;
      //this.materials.road.shader.uniforms.animation_time = 0;
  }

  generate_traffic(context, program_state, t) {
      if(!this.collision_detected) {
          const trafficZ = -200;
          //this.traffic_transform[i].car_transform = Mat4.translation(0, 0.6, -50).times(Mat4.scale(1.25, 1.25, 1.25)); middle lane
          //this.traffic_transform[i].car_transform = Mat4.translation(-5, 0.6, -50).times(Mat4.scale(1.25, 1.25, 1.25)); left lane
          //this.traffic_transform[i].car_transform = Mat4.translation(5, 0.6, -50).times(Mat4.scale(1.25, 1.25, 1.25)); right lane
          for(let i = 0; i < this.traffic_transform.length; i++) {
              this.traffic_transform[i].car_transform = Mat4.translation(5, 0.6, trafficZ).times(Mat4.scale(1.25, 1.25, 1.25));
          }

          if (
              5 * (t - this.time_elapsed_1) <=
              Math.abs(trafficZ) / this.acceleration_rate + 2
          ) {
              this.traffic_transform[1].car_transform = this.traffic_transform[1].car_transform.times(
                  Mat4.translation(
                      0,
                      0,
                      5 * this.acceleration_rate * (t - this.time_elapsed_1)
                  )
              );
          } else {
              this.time_elapsed_1 = t;
          }
      }

      this.cars[this.randomCarNum2].car.draw(
          context,
          program_state,
          this.traffic_transform[1].car_transform,
          this.materials.car
      );
  }

  checkCollision() {
      const car_pos = this.car_transform.times(vec4(0, 0, 0, 1)); //get a snapshot of the car position
      for (let i = 0; i < this.traffic_transform.length; i++) {
          const traffic_pos = this.traffic_transform[i].car_transform.times(vec4(0, 0, 0, 1));
          const distance = Math.sqrt(
              Math.pow(car_pos[0] - traffic_pos[0], 2) +
              Math.pow(car_pos[1] - traffic_pos[1], 2) +
              Math.pow(car_pos[2] - traffic_pos[2], 2)
          );
          if (distance < this.collision_threshold) {
              this.collision_detected = true;
              this.materials.road.shader.uniforms.stop_texture_update = 1; // Stop texture update
              this.materials.road.shader.uniforms.offset = 0;
              break;
          }
      }
  }

  restart() {
      this.time_elapsed_1 = 0;
      this.time_elapsed_2 = 0;
      this.time_elapsed_3 = 0;

      this.car_transform = Mat4.identity();
      this.traffic_transform = [
          this.car_transform = Mat4.identity(),
          this.car_transform = Mat4.identity(),
          this.car_transform = Mat4.identity(),
      ];
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

      this.collision_detected = false;

      this.tilt_angle = 0;
      this.current_tilt = 0;
      this.target_tilt = 0;

      this.materials.road.shader.uniforms.stop_update = 0;
      //this.materials.road.shader.uniforms.animation_time = 0;
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
      this.car_transform = Mat4.translation(...this.car_position)
          .times(Mat4.rotation(this.current_tilt, 0, 1, 0))
          .times(Mat4.translation(0, 0.6, 0))
          .times(Mat4.rotation(Math.PI, 0, 1, 0))
          .times(Mat4.scale(1.25, 1.25, 1.25));
      // Rotation around the Y-axis for tilt

      const road_left_bound = -6; // Left boundary of the road
      const road_right_bound = 6; // Right boundary of the road

      // Check if the car is within the bounds after updating its position
      if (this.car_position[0] < road_left_bound) {
          this.car_position[0] = road_left_bound; // Reset to left bound
          this.car_velocity[0] = 0; // Stop the car's lateral movement
      } else if (this.car_position[0] > road_right_bound) {
          this.car_position[0] = road_right_bound; // Reset to right bound
          // this.car_velocity[0] = 0; // Stop the car's lateral movement
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

    const light_position = vec4(0, 500, 5, 1);
    // The parameters of the Light are: position, color, size
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000000)];
    for(let i = 0; i < 501; i += 5) {
      program_state.lights.push(new Light(vec4(0, 5, i, 1), color(1,1,1,1), 1000));
    }
    // for(let i = -50; i < 50; ++i) {
    //   program_state.lights.push(new Light(vec4(i, 5, 499, 1)),color(1, 1, 1, 1), 1000);
    // }

      this.materials.road.shader.uniforms.stop_update = 0;
      this.materials.road.shader.uniforms.offset = 0;
      this.materials.road.shader.uniforms.animation_time = 0;

      this.materials.rainbow.shader.uniforms.stop_texture_update = 0;
      this.materials.rainbow.shader.uniforms.texture_offset = 0;
      this.materials.rainbow.shader.uniforms.animation_time = 0;

      this.materials.grass.shader.uniforms.stop_texture_update = 0;
      this.materials.grass.shader.uniforms.texture_offset = 0;
      this.materials.grass.shader.uniforms.animation_time = 0;


      this.materials.stars.shader.uniforms.stop_texture_update = 0;
      this.materials.stars.shader.uniforms.texture_offset = 0;
      this.materials.stars.shader.uniforms.animation_time = 0;

      this.materials.stars_still.shader.uniforms.stop_texture_update = 0;
      this.materials.stars_still.shader.uniforms.texture_offset = 0;
      this.materials.stars_still.shader.uniforms.animation_time = 0;

      this.materials.sky.shader.uniforms.stop_texture_update = 0;
      this.materials.sky.shader.uniforms.texture_offset = 0;
      this.materials.sky.shader.uniforms.animation_time = 0;

    const t = program_state.animation_time / 1000;
    let t2;
    const dt = program_state.animation_delta_time / 1000;

    if(!this.collision_detected) {
        this.update_state(dt);
        this.materials.road.shader.uniforms.offset += this.acceleration_rate * t/450;
    this.materials.grass.shader.uniforms.texture_offset += this.acceleration_rate * t/10;
    this.materials.rainbow.shader.uniforms.texture_offset += this.acceleration_rate * t/22.5;
    this.materials.stars.shader.uniforms.texture_offset += this.acceleration_rate * t/450;
    this.materials.stars_still.shader.uniforms.texture_offset += this.acceleration_rate * t/750;
    this.materials.sky.shader.uniforms.texture_offset += this.acceleration_rate * t/750;




    }
    this.generate_traffic(context, program_state, t/5);

    const road_transform = this.road_transform.times(
      Mat4.translation(0, -0.5, 0)
    );

    const grass_left_transform = this.grass_left_transform.times(
      Mat4.translation(-1.1,-.5,0)
    )

    const grass_right_transform = this.grass_right_transform.times(
      Mat4.translation(1.1,-.5,0)
    )

    const sky_transform = this.sky_transform.times(Mat4.translation(0,0,-500))

    const cone_transform = this.cone_transform.times(Mat4.translation(0,0,-100))


    if(this.grass_flag) {
      this.shapes.road.draw(   // NORMAL ROAD
        context,
        program_state,
        road_transform,
        this.materials.road
      );

      this.shapes.sky.draw(        //GRASS ON LEFT
      context,
      program_state,
      sky_transform,
      this.materials.sky
    );

      
      this.shapes.grass.draw(        //GRASS ON LEFT
        context,
        program_state,
        grass_left_transform,
        this.materials.grass
      )

      this.shapes.grass.draw(       // GRASS ON RIGHT
        context,
        program_state,
        grass_right_transform,
        this.materials.grass
      )
    }
    
  else if (this.rainbow_road_flag) {
      this.shapes.rainbow_road.draw(     //RAINBOW ROAD
      context,
      program_state,
      road_transform,
      this.materials.rainbow
      );
      this.shapes.sky.draw(
        context,
        program_state,
        sky_transform,
        this.materials.stars_still
      )
    }


    this.cars[this.randomCarNum].car.draw(
      context,
      program_state,
      this.car_transform,
      this.materials.car
    );



    // this.shapes.cone.draw(
    //   context,
    //   program_state,
    //   cone_transform,
    //   this.materials.cone
    // )
    const original_tree_position_1 = -140;
    const original_tree_position_2 = -200;
    const original_car2_position = -160;

    this.checkCollision();
/*
* this.tree_transform_1 = this.tree_transform_1.times(
      Mat4.translation(-18, -0.5, original_tree_position_1)
    );

  //   if (
  //     5 * (t - this.time_elapsed_1) <=
  //     Math.abs(original_tree_position_1) / this.acceleration_rate + 2
  //   ) {
  //     this.tree_transform_1 = this.tree_transform_1.times(
  //       Mat4.translation(
  //         0,
  //         0,
  //         5 * this.acceleration_rate * (t - this.time_elapsed_1)
  //       )
  //     );
  //   } else {
  //     this.time_elapsed_1 = t;
  //   }
  //   this.shapes.tree.draw(
  //     context,
  //     program_state,
  //     this.tree_transform_1,
  //     this.materials.tree
  //   );

  //   this.tree_transform_2 = this.road_transform.times(
  //     Mat4.translation(-18, 0, original_tree_position_2)
  //   );

  //   if (
  //     5 * (t - this.time_elapsed_2) <=
  //     Math.abs(original_tree_position_2) / this.acceleration_rate + 2
  //   ) {
  //     this.tree_transform_2 = this.tree_transform_2.times(
  //       Mat4.translation(
  //         0,
  //         0,
  //         5 * this.acceleration_rate * (t - this.time_elapsed_2)
  //       )
  //     );
  //   } else {
  //     this.time_elapsed_2 = t;
  //   }
  //   this.shapes.tree.draw(
  //     context,
  //     program_state,
  //     this.tree_transform_2,
  //     this.materials.tree
  //   );

  //   this.tree_transform_1 = this.tree_transform_1.times(
  //     Mat4.translation(-5, 5, 0)
  //   );
  //   this.tree_transform_2 = this.tree_transform_2.times(
  //     Mat4.translation(5, 5, 0)
  //   );

  //   for (let i = 0; i < 4; i++) {
  //     this.shapes.leaves.draw(
  //       context,
  //       program_state,
  //       this.tree_transform_1,
  //       this.materials.leaves
  //     );
  //     this.shapes.leaves.draw(
  //       context,
  //       program_state,
  //       this.tree_transform_2,
  //       this.materials.leaves
  //     );
  //     this.tree_transform_1 = this.tree_transform_1
  //       .times(Mat4.translation(5, 0, 0)) // Translate to origin
  //       .times(Mat4.rotation(Math.PI / 2, 0, 1, 0)) // Rotate around origin
  //       .times(Mat4.translation(-5, 0, 0)); // Translate back

  //     this.tree_transform_2 = this.tree_transform_2
  //       .times(Mat4.translation(-5, -5, 0)) // Translate to origin
  //       .times(Mat4.rotation(Math.PI / 2, 0, 1, 0)) // Rotate around origin
  //       .times(Mat4.translation(5, 5, 0)); // Translate back
    // }
  }
}
