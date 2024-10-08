import { tiny, defs, Text_Line } from "./objects.js";
import { Shapes_From_File, Custom_Shader } from "./object_loader.js";

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
const { Textured_Phong, Textured_Phong_fog } = defs;
export class CarGame extends Scene {
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();
    const bump = new defs.Fake_Bump_Map(1);
    // At the beginning of our program, load one of each of these shape definitions onto the GPU.
    this.shapes = {
      box: new defs.Box(2, 1, 4),
      //road: new defs.Box(20, 0.1, 500),
      road: new defs.Cube(),
      rainbow_road: new defs.Cube(),
      grass: new defs.Cube(),
      tree: new defs.Box(5, 10, 3),
      leaves: new defs.Box(5, 5, 5),
      // car: new Shapes_From_File("assets/Car.obj"),
      // car2: new Shapes_From_File("assets/Car2.obj"),
      // cone: new Shapes_From_File("assets/ConeFolder/objPylon.obj"),
      sky: new defs.Cube(),
      // car3: new Shapes_From_File("assets/Car3.obj"),
      // car4: new Shapes_From_File("assets/Car4.obj"),
      // car5: new Shapes_From_File("assets/Car5.obj"),
      // car6: new Shapes_From_File("assets/Car6.obj"),
      // car7: new Shapes_From_File("assets/Car7.obj"),
      coin: new defs.Cube(2, 2, 2),
      text: new Text_Line(35),
      cube: new defs.Cube(),
      hay: new defs.Cube(6, 2, 2),
      sphere4: new defs.Subdivision_Sphere(4),
      sphere3: new defs.Subdivision_Sphere(3),
      sphere2: new defs.Subdivision_Sphere(2),
      sphere1: new defs.Subdivision_Sphere(1),
    };

    this.shapes.grass.arrays.texture_coord.forEach((element) => {
      element.scale_by(30);
    });

    this.shapes.rainbow_road.arrays.texture_coord.forEach((element) => {
      element.scale_by(5);
    });

    this.shapes.sky.arrays.texture_coord.forEach((element) => {
      element.scale_by(3);
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

    this.randomCarNum = 0;
    this.randomCarNum2 = 0;
    this.randomCarNum3 = 0;
    this.randomCarNum4 = 0;
    this.resetTime = false;

    // *** Materials
    this.materials = {
      car: new Material(new Textured_Phong_fog(), {
        ambient: 1,
      }),
      moon: new Material(new Textured_Phong(), {
        ambient: 1,
        // color: hex_color("FFFFFF")
        specularity: 0.1,
        texture: new Texture("assets/moon_texture.jpeg"),
      }),
      redrock: new Material(new Textured_Phong(), {
        ambient: 1,
        // color: hex_color("FFFFFF")
        specularity: 0.1,
        texture: new Texture("assets/red_rock.jpeg"),
      }),
      darkrock: new Material(new Textured_Phong(), {
        ambient: 1,
        // color: hex_color("FFFFFF")
        specularity: 0.1,
        texture: new Texture("assets/darker_rock.jpeg"),
      }),
      grey: new Material(new defs.Phong_Shader(), {
        color: color(0.5, 0.5, 0.5, 1),
        ambient: 0,
        diffusivity: 0.3,
        specularity: 0.5,
        smoothness: 10,
      }),
      cube: new defs.Cube(),
      road: new Material(new Textured_Phong(), {
        ambient: 0.5,
        texture: new Texture("assets/road_texture.png"),
        specularity: 0.1,
      }),
      grass: new Material(new Textured_Phong(), {
        ambient: 0.5,
        specularity: 0,
        texture: new Texture("assets/grass.png"),
      }),
      text_image: new Material(new defs.Textured_Phong(1), {
        ambient: 1,
        diffusivity: 0,
        specularity: 0,
        texture: new Texture("assets/text.png"),
      }),
      sky: new Material(new Textured_Phong(), {
        ambient: 1,
        texture: new Texture("assets/cloudy_sky.jpeg"),
      }),
      rainbow: new Material(new Textured_Phong(), {
        ambient: 0.5,
        texture: new Texture("assets/rainbow_road.png"),
        specularity: 0.7,
      }),
      stars: new Material(new Textured_Phong(), {
        ambient: 1,
        texture: new Texture("assets/stars_.png"),
      }),
      coin: new Material(new Textured_Phong(), {
        ambient: 1,
        texture: new Texture("assets/qmark2.png"),
      }),
      hay: new Material(new Textured_Phong(), {
        bump,
        ambient: 0.8,
        specularity: 0,
        // diffusivity: .5,
        texture: new Texture("assets/haytexture_loopable.png"),
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

    //sound
    this.sound = document.getElementById("crashSound");
    this.soundPlayed = false;
    this.sound.volume = 0.0;

    this.rainbow_road_flag = false;
    this.grass_flag = true;

    this.time_elapsed_1 = 0;
    this.time_elapsed_2 = 0;
    this.time_elapsed_3 = 0;

    this.time_elapsed = [0, 0, 0, 0, 0, 0];
    this.hay_time_elapsed = [0, 0, 0, 0, 0, 0, 0, 0];
    this.ast_time_elapsed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.hay_cycles = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    this.car_transform = Mat4.identity();
    this.traffic_transform = [
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
    ];

    this.object_transform = Mat4.identity();
    this.space_transform = [
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
      (this.object_transform = Mat4.identity()),
    ];

    this.rotation_angles = [0, Math.PI / 3, Math.PI / 4, Math.PI / 6];
    this.hay_angles = [];
    for (let i = 0; i < 16; i++) {
      this.hay_angles.push(this.rotation_angles[i % 4]);
    }

    this.hay_transform = Mat4.identity();
    this.grass_transform = [
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
      (this.hay_transform = Mat4.identity()),
    ];

    this.car2_transform = Mat4.identity();
    this.road_transform = Mat4.identity().times(Mat4.scale(10, 0.1, 300));
    this.moon_transform = Mat4.identity()
      .times(Mat4.scale(20, 20, 20))
      .times(Mat4.translation(10, 0.5, -10));
    this.grass_left_transform = Mat4.identity().times(
      Mat4.scale(100, 0.1, 300)
    );
    this.grass_right_transform = Mat4.identity().times(
      Mat4.scale(100, 0.1, 300)
    );
    this.sky_transform = Mat4.identity().times(Mat4.scale(1000, 1000, 1));
    this.tree_transform_1 = Mat4.identity();
    this.tree_transform_2 = Mat4.identity();

    // Movement state
    this.car_position = vec3(0, 0, 0); // Use a vector to represent position
    this.car_velocity = vec3(0, 0, 0); // Velocity vector
    this.car_acceleration = vec3(0, 0, 0); // Acceleration vector

    this.game_speed = 10;
    this.speed_increase_rate = 1;

    // Physics Constants
    this.max_speed = 10;

    this.car_mass = 9;
    this.coefficient_of_friction = 0.25;
    this.applied_force = 210;
    this.braking_force = 65;
    this.friction_force = this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity

    this.total_acceleration_force = this.applied_force - this.friction_force;
    this.total_deceleration_force = this.braking_force + this.friction_force;

    this.acceleration_rate = this.total_acceleration_force / this.car_mass;
    this.deceleration_rate = this.total_deceleration_force / this.car_mass;

    if (this.acceleration_rate < 0) {
      this.acceleration_rate = 0;
    }

    this.collision_threshold_coin = 2.5;
    this.collision_threshold_traffic = 2.5;
    this.collision_detected = false;

    console.log(this.acceleration_rate);

    this.tilt_angle = 0;
    this.current_tilt = 0;
    this.target_tilt = 0;

    //coin stuff
    this.last_coin_time = 0; // Tracks the last time a coin was generated
    this.coin_generated = false; // Indicates if a coin is currently generated and on the screen
    this.coin_speed = 1; // You can adjust this based on your game's speed or dynamics
    this.coin_transform = Mat4.identity(); // The coin's transformation matrix
    this.coin_interval = 5; // The interval between coin generations
    this.coin_rotation_angle = 0.01;

    this.resetDist = [0, 0, 0, 0, 0, 0, 0, 0];
    this.distTraveled = [0, 0, 0, 0, 0, 0, 0, 0];

    //score
    this.score_transformation = Mat4.identity().times(
      Mat4.translation(5, 8, 0)
    );
    this.score = 0;

    //collision
    this.allow_collisions = true;
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
        if (!this.collision_detected) {
          this.car_acceleration[0] = -this.acceleration_rate;
          this.target_tilt = Math.PI / 2; // Set to desired tilt angle for left turn
          this.tilt_angle = -5;
        }
      },
      undefined,
      () => {
        if (!this.collision_detected) {
          this.car_acceleration[0] = 0;
          this.target_tilt = 0; // Reset to no tilt when key is released
          this.tilt_angle = 0;
        }
      }
    );
    this.key_triggered_button(
      "Move Right",
      ["ArrowRight"],
      () => {
        if (!this.collision_detected) {
          this.car_acceleration[0] = this.acceleration_rate;
          this.target_tilt = -Math.PI / 2; // Set to desired tilt angle for right turn
          this.tilt_angle = 5;
        }
      },
      undefined,
      () => {
        if (!this.collision_detected) {
          this.car_acceleration[0] = 0;
          this.target_tilt = 0; // Reset to no tilt when key is released
          this.tilt_angle = 0;
        }
      }
    );
    this.new_line();
    this.key_triggered_button(
      "Move Left",
      ["a"],
      () => {
        if (!this.collision_detected) {
          this.car_acceleration[0] = -this.acceleration_rate;
          this.target_tilt = Math.PI / 2; // Set to desired tilt angle for left turn
          this.tilt_angle = -5;
        }
      },
      undefined,
      () => {
        if (!this.collision_detected) {
          this.car_acceleration[0] = 0;
          this.target_tilt = 0; // Reset to no tilt when key is released
          this.tilt_angle = 0;
        }
      }
    );
    this.key_triggered_button(
      "Move Right",
      ["d"],
      () => {
        if (!this.collision_detected) {
          this.car_acceleration[0] = this.acceleration_rate;
          this.target_tilt = -Math.PI / 2; // Set to desired tilt angle for right turn
          this.tilt_angle = 5;
        }
      },
      undefined,
      () => {
        if (!this.collision_detected) {
          this.car_acceleration[0] = 0;
          this.target_tilt = 0; // Reset to no tilt when key is released
          this.tilt_angle = 0;
        }
      }
    );
    this.key_triggered_button("Restart Game", ["r"], () => {
      this.restart();
    });
    this.new_line();
    const max_speed_controls = this.control_panel.appendChild(
      document.createElement("span")
    );

    max_speed_controls.style.margin = "30px";
    this.key_triggered_button(
      "-",
      ["n"],
      () => {
        if (!this.collision_detected) {
          this.max_speed /= 1.2;
          if (this.max_speed < 0) {
            this.max_speed = 0;
          }
        }
      },
      undefined,
      undefined,
      undefined,
      max_speed_controls
    );
    this.live_string((car) => {
      car.textContent = "Max Speed: " + this.max_speed.toFixed(2);
    }, max_speed_controls);
    this.key_triggered_button(
      "+",
      ["m"],
      () => {
        this.max_speed *= 1.2;
      },
      undefined,
      undefined,
      undefined,
      max_speed_controls
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
        if (!this.collision_detected) {
          this.car_mass /= 1.2;
          this.friction_force =
            this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity
          this.acceleration_rate =
            this.total_acceleration_force / this.car_mass;
          this.deceleration_rate =
            this.total_deceleration_force / this.car_mass;
          if (this.acceleration_rate < 0) {
            this.acceleration_rate = 0;
          }
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
        if (!this.collision_detected) {
          this.car_mass *= 1.2;
          this.friction_force =
            this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity
          this.acceleration_rate =
            this.total_acceleration_force / this.car_mass;
          this.deceleration_rate =
            this.total_deceleration_force / this.car_mass;
          if (this.acceleration_rate < 0) {
            this.acceleration_rate = 0;
          }
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
        if (!this.collision_detected) {
          this.applied_force /= 1.2;
          this.total_acceleration_force =
            this.applied_force - this.friction_force;
          this.acceleration_rate =
            this.total_acceleration_force / this.car_mass;
          if (this.acceleration_rate < 0) {
            this.acceleration_rate = 0;
          }
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
        if (!this.collision_detected) {
          this.applied_force *= 1.2;
          this.total_acceleration_force =
            this.applied_force - this.friction_force;
          this.acceleration_rate =
            this.total_acceleration_force / this.car_mass;
          if (this.acceleration_rate < 0) {
            this.acceleration_rate = 0;
          }
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
        if (!this.collision_detected) {
          this.braking_force /= 1.2;
          this.total_deceleration_force =
            this.braking_force + this.friction_force;
          this.deceleration_rate =
            this.total_deceleration_force / this.car_mass;
        }
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
        if (!this.collision_detected) {
          this.braking_force *= 1.2;
          this.total_deceleration_force =
            this.braking_force + this.friction_force;
          this.deceleration_rate =
            this.total_deceleration_force / this.car_mass;
        }
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
        if (!this.collision_detected) {
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

          this.acceleration_rate =
            this.total_acceleration_force / this.car_mass;
          this.deceleration_rate =
            this.total_deceleration_force / this.car_mass;

          if (this.acceleration_rate < 0) {
            this.acceleration_rate = 0;
          }
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
        if (!this.collision_detected) {
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

          this.acceleration_rate =
            this.total_acceleration_force / this.car_mass;
          this.deceleration_rate =
            this.total_deceleration_force / this.car_mass;

          if (this.acceleration_rate < 0) {
            this.acceleration_rate = 0;
          }
        }
      },
      undefined,
      undefined,
      undefined,
      coefficient_of_friction_controls
    );

    this.key_triggered_button("Rainbow Road", ["c"], () => {
      this.rainbow_road_flag = true;
      this.grass_flag = false;
    });
    this.key_triggered_button("Grass Land", ["g"], () => {
      this.rainbow_road_flag = false;
      this.grass_flag = true;
    });
    this.new_line();
    const collision_controls = this.control_panel.appendChild(
      document.createElement("span")
    );
    this.key_triggered_button(
      "Enable/Disable Collisions",
      ["f"],
      () => {
        this.allow_collisions = !this.allow_collisions;
      },
      undefined,
      undefined,
      undefined,
      collision_controls
    );

    this.live_string((car) => {
      car.textContent = "Collisions: " + this.allow_collisions;
    }, collision_controls);
  }

  generate_traffic(context, program_state, t) {
    if (!this.collision_detected) {
      const trafficZ = [-135, -200, -150, -170, -230, -210];

      for (let i = 0; i < this.traffic_transform.length; i++) {
        let x_dist = i;
        if (i > 2) {
          x_dist = i - 3;
        }
        this.traffic_transform[i].car_transform = Mat4.translation(
          5 - 5 * x_dist,
          0.6,
          trafficZ[i]
        ).times(Mat4.scale(1.25, 1.25, 1.25));
      }

      for (let i = 0; i < 6; i++) {
        if (
          5 * (t - this.time_elapsed[i]) <=
          Math.abs(trafficZ[i]) / this.game_speed
        ) {
          this.traffic_transform[i].car_transform = this.traffic_transform[
            i
          ].car_transform.times(
            Mat4.translation(
              0,
              0,
              5 * this.game_speed * 1.25 * (t - this.time_elapsed[i])
            )
          );
        } else {
          this.time_elapsed[i] = t;
          this.score += 1;
        }
      }
    }

    for (let i = 0; i < 6; i++) {
      this.cars[i].car.draw(
        context,
        program_state,
        this.traffic_transform[i].car_transform,
        this.materials.car
      );
    }
  }

  checkCoinCollision() {
    const car_pos = this.car_transform.times(vec4(0, 0, 0, 1)); //get a snapshot of the car position
    const coin_pos = this.coin_transform.times(vec4(0, 0, 0, 1));
    const distance = Math.sqrt(
      Math.pow(car_pos[0] - coin_pos[0], 2) +
        Math.pow(car_pos[1] - coin_pos[1], 2) +
        Math.pow(car_pos[2] - coin_pos[2], 2)
    );
    if (distance < this.collision_threshold_coin && this.coin_generated) {
      this.coin_generated = false;
      this.score += 3;
    }
  }

  checkTrafficCollision() {
    const car_pos = this.car_transform.times(vec4(0, 0, 0, 1)); //get a snapshot of the car position
    for (let i = 0; i < this.traffic_transform.length; i++) {
      const traffic_pos = this.traffic_transform[i].car_transform.times(
        vec4(0, 0, 0, 1)
      );
      const distance = Math.sqrt(
        Math.pow(0.94 * (car_pos[0] - traffic_pos[0]), 2) +
          Math.pow(car_pos[1] - traffic_pos[1], 2) +
          Math.pow(0.45 * (car_pos[2] - traffic_pos[2]), 2)
      );
      if (distance < this.collision_threshold_traffic) {
        this.collision_detected = true;
        this.materials.road.shader.uniforms.stop_texture_update = 1; // Stop texture update
        this.materials.road.shader.uniforms.offset = 0;
        break;
      }
    }
  }

  generateSpaceObjects(context, program_state, t) {
    if (!this.collision_detected) {
      const startingZ = [
        -300, -350, -380, -400, -300, -360, -450, -480, -300, -500, -320,
      ];

      for (let i = 0; i < 11; i++) {
        if (i < 3) {
          if (i % 2 == 1) {
            this.space_transform[i].object_transform = Mat4.translation(
              30,
              -5,
              startingZ[i]
            ).times(Mat4.scale(2.0, 1.25, 1.25));
          } else {
            this.space_transform[i].object_transform = Mat4.translation(
              20 - 20 * i,
              10,
              startingZ[i]
            ).times(Mat4.scale(1.25, 1.25, 1.25));
          }
        } else if (i < 6) {
          if (i % 2 == 1) {
            this.space_transform[i].object_transform = Mat4.translation(
              30 - 5 * 0.1 * t,
              15,
              startingZ[i]
            ).times(Mat4.scale(1.25, 2.0, 1.25));
          } else {
            this.space_transform[i].object_transform = Mat4.translation(
              20 - 20 * i,
              -5,
              startingZ[i]
            ).times(Mat4.scale(2.0, 3.0, 3.0));
          }
        } else if (i < 8) {
          if (i % 2 == 1) {
            this.space_transform[i].object_transform = Mat4.translation(
              30 - 5 * 0.1 * t,
              -10,
              startingZ[i]
            ).times(Mat4.scale(1.25, 1.25, 1.25));
          } else {
            this.space_transform[i].object_transform = Mat4.translation(
              -30,
              -7,
              startingZ[i]
            ).times(Mat4.scale(1.25, 1.25, 1.25));
          }
        } else {
          if (i % 2 == 1) {
            this.space_transform[i].object_transform = Mat4.translation(
              -50 + 2 * i,
              -20,
              startingZ[i]
            ).times(Mat4.scale(1.25, 1.25, 1.25));
          } else {
            this.space_transform[i].object_transform = Mat4.translation(
              -30,
              0,
              startingZ[i]
            ).times(Mat4.scale(1.25, 1.25, 1.25));
          }
        }
      }

      for (let i = 0; i < 11; i++) {
        if (
          7 * (t - this.ast_time_elapsed[i]) <=
          Math.abs(startingZ[i]) / this.game_speed
        ) {
          this.space_transform[i].object_transform = this.space_transform[
            i
          ].object_transform.times(
            Mat4.translation(
              0,
              0,
              5 * this.game_speed * 2 * (t - this.ast_time_elapsed[i])
            )
          );
        } else {
          this.ast_time_elapsed[i] = t;
        }
      }
      for (let i = 0; i < 11; i++) {
        if (i < 3) {
          this.space_transform[i].object_transform = this.space_transform[
            i
          ].object_transform.times(Mat4.rotation(2 * t * Math.PI, 0, 1, 0));
          this.shapes.sphere1.draw(
            context,
            program_state,
            this.space_transform[i].object_transform,
            this.materials.moon
          );
        } else if (i < 6) {
          this.space_transform[i].object_transform = this.space_transform[
            i
          ].object_transform.times(Mat4.rotation(2 * t * Math.PI, 1, 1, 0));
          this.shapes.sphere2.draw(
            context,
            program_state,
            this.space_transform[i].object_transform,
            this.materials.darkrock
          );
        } else if (i < 8) {
          this.space_transform[i].object_transform = this.space_transform[
            i
          ].object_transform.times(Mat4.rotation(2 * t * Math.PI, 0, 0, 1));
          this.shapes.sphere3.draw(
            context,
            program_state,
            this.space_transform[i].object_transform,
            this.materials.moon
          );
        } else if (i == 9) {
          this.shapes.sphere1.draw(
            context,
            program_state,
            this.space_transform[i].object_transform,
            this.materials.moon
          );
        } else {
          this.space_transform[i].object_transform = this.space_transform[
            i
          ].object_transform.times(Mat4.rotation(2 * t * Math.PI, 1, 0, 1));
          this.shapes.sphere4.draw(
            context,
            program_state,
            this.space_transform[i].object_transform,
            this.materials.darkrock
          );
        }
      }
    }
  }

  generateHay(context, program_state, zpos) {
    if (!this.collision_detected) {
      const hayX = [
        -70, -50, -30, -15, 15, 45, 28, 60, -80, -120, -100, -90, 120, 75, 90,
        105,
      ];
      const hayZ = [-275, -300, -340, -290, -320, -335, -285, -295];
      for (let i = 0; i < 16; i++) {
        if (1.4 * zpos > Math.abs(hayZ[i % 8] * this.hay_cycles[i]) + 20) {
          this.hay_cycles[i] += 1;
          console.log(1.4 * zpos);
          this.hay_angles[i] = Math.random() % 4;
          // console.log(this.hay_cycles[i]);
        }
        this.grass_transform[i].hay_transform = Mat4.translation(
          hayX[i],
          0,
          this.hay_cycles[i] * hayZ[i % 8] + 1.4 * zpos
        )
          .times(Mat4.scale(2, 2, 2))
          .times(Mat4.rotation(this.hay_angles[i], 0, 1, 0));
        // console.log(this.hay_cycles[i]);
      }

      // for (let i = 0; i < 8; i++) {
      //   if (
      //     //  3 * (dt - this.hay_time_elapsed[i]) <=
      //     // Math.abs(hayZ[i]) / (this.game_speed)
      //     this.hay_distance[i] <= hayZ[i]
      //     // this.distTraveled[i] < Math.abs(hayZ[i])
      //   ) {
      //     this.grass_transform[i].hay_transform = this.grass_transform[i].hay_transform.times(
      //       Mat4.translation(
      //         0,
      //         0,
      //         0
      //         // hay_distance[i] + zpos/450
      //         // (Math.pow(this.game_speed,1.3)  * (dt - this.hay_time_elapsed[i]) /2 )
      //       )
      //     );
      //     this.hay_distance[i] = this.hay_distance[i] + zpos/450;
      //   } else {
      //     // this.hay_time_elapsed[i] = dt;
      //     // console.log(zpos)
      //     this.hay_distance[i] = 0;
      //   }
      // }
    }

    for (let i = 0; i < 16; i++) {
      this.grass_transform[i].hay_transform =
        this.grass_transform[i].hay_transform;
      this.shapes.hay.draw(
        context,
        program_state,
        this.grass_transform[i].hay_transform,
        this.materials.hay
      );
    }
  }

  restart() {
    this.sound.pause();
    this.soundPlayed = false;
    this.sound.currentTime = 0;
    this.time_elapsed_1 = 0;
    this.time_elapsed_2 = 0;
    this.time_elapsed_3 = 0;
    this.time_elapsed = [0, 0, 0, 0, 0, 0];

    this.car_transform = Mat4.identity();
    this.traffic_transform = [
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
      (this.car_transform = Mat4.identity()),
    ];

    for (let i = 0; i < this.hay_cycles.length; i++) {
      this.hay_cycles[i] = 1;
    }
    // Movement state
    //this.car_position = vec3(0, 0, 0); // Use a vector to represent position
    //this.car_velocity = vec3(0, 0, 0); // Velocity vector
    //this.car_acceleration = vec3(0, 0, 0); // Acceleration vector

    // Physics Constants

    // this.car_mass = 9;
    // this.coefficient_of_friction = 0.25;
    // this.applied_force = 210;
    // this.braking_force = 65;
    // this.friction_force = this.coefficient_of_friction * this.car_mass * 9.8; //9.8 for gravity

    // this.total_acceleration_force = this.applied_force - this.friction_force;
    // this.total_deceleration_force = this.braking_force + this.friction_force;

    // this.acceleration_rate = this.total_acceleration_force / this.car_mass;
    // this.deceleration_rate = this.total_deceleration_force / this.car_mass;

    // if (this.acceleration_rate < 0) {
    //   this.acceleration_rate = 0;
    // }

    this.collision_detected = false;

    this.tilt_angle = 0;
    this.current_tilt = 0;
    this.target_tilt = 0;

    this.materials.road.shader.uniforms.stop_texture_update = 0;
    this.materials.road.shader.uniforms.texture_offset = 0;
    this.materials.road.shader.uniforms.animation_time = 0;

    this.resetTime = true;

    //score update
    this.score = 0;

    // coin update
    this.coin_generated = false;
    this.last_coin_time = 0;
  }

  update_state(dt) {
    this.game_speed += dt * this.speed_increase_rate;
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

  generate_coins(context, program_state, t) {
    if (!this.coin_generated && t - this.last_coin_time >= this.coin_interval) {
      // Randomly select a lane for the coin
      const laneIndex = Math.floor(Math.random() * 3);
      const lanePositionX = 5 - 5 * laneIndex;
      let random = Math.random();
      if (random < 5 / 6) {
        // 5 out of 6 chances to fall into the first part of the range
        this.coin_speed = 0.3 + random * (0.3 / (5 / 6));
      } else {
        // 1 out of 6 chances to fall into the second part of the range
        this.coin_speed = 0.61 + (random - 5 / 6) * (0.39 / (1 / 6));
      }

      // Reset coin_transform for the new coin
      this.coin_transform = Mat4.rotation(Math.PI / 2, 1, 0, 0)
        .times(Mat4.scale(1, 0.2, 1)) // Scale the coin
        .times(Mat4.translation(lanePositionX, -950, -2)); // Then translate it to the desired position
      this.coin_generated = true;
    }

    // Logic to move the coin
    if (this.coin_generated && !this.collision_detected) {
      // Adjust to check the coin's position along the Y-axis, assuming it's the new forward direction
      let coinZ = this.coin_transform[2][3];
      if (coinZ > 20) {
        // Adjust condition to match the new axis
        this.coin_generated = false; // Allow a new coin to spawn
        this.last_coin_time = t;
      } else {
        // Move the coin along its new forward direction, which is the Y-axis after rotation
        this.coin_transform = Mat4.translation(0, 0, this.coin_speed) // Move the coin along its new Y-axis
          .times(this.coin_transform) // Apply existing transformations
          .times(Mat4.rotation(this.coin_rotation_angle, 0, 0, 1)); // Add rotation around the x-axis
      }
    }

    // Drawing the coin
    if (this.coin_generated) {
      this.shapes.coin.draw(
        context,
        program_state,
        this.coin_transform,
        this.materials.coin
      );
    }
  }

  generateScore(context, program_state) {
    this.shapes.text.set_string(`Score: ${this.score}`, context.context);
    this.shapes.text.draw(
      context,
      program_state,
      this.score_transformation.times(Mat4.scale(0.5, 0.5, 0.5)),
      this.materials.text_image
    );
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
    const overhead_light_position = vec(0, 5, 5, 1);
    // The parameters of the Light are: position, color, size
    program_state.lights = [
      new Light(light_position, color(1, 1, 1, 1), 1000000),
      new Light(overhead_light_position, color(1, 1, 1, 1), 1000),
    ];
    // for(let i = -50; i < 50; ++i) {
    //   program_state.lights.push(new Light(vec4(i, 5, 499, 1)),color(1, 1, 1, 1), 1000);
    // }

    this.materials.road.shader.uniforms.stop_update = 0;
    this.materials.road.shader.uniforms.offset = 0;
    this.materials.road.shader.uniforms.animation_time = 0;

    this.materials.rainbow.shader.uniforms.stop_texture_update = 0;
    this.materials.rainbow.shader.uniforms.offset = 0;
    this.materials.rainbow.shader.uniforms.animation_time = 0;

    this.materials.grass.shader.uniforms.stop_texture_update = 0;
    this.materials.grass.shader.uniforms.offset = 0;
    this.materials.grass.shader.uniforms.animation_time = 0;

    this.materials.stars.shader.uniforms.stop_texture_update = 0;
    this.materials.stars.shader.uniforms.offset = 0;
    this.materials.stars.shader.uniforms.animation_time = 0;

    this.materials.sky.shader.uniforms.stop_texture_update = 0;
    this.materials.sky.shader.uniforms.offset = 0;
    this.materials.sky.shader.uniforms.animation_time = 0;

    if (this.resetTime) {
      program_state.animation_time = 0;
      program_state.animation_delta_time = 0;
      this.game_speed = 0;
      this.resetTime = false;
      for (let i = 0; i < 8; i++) {
        this.hay_time_elapsed[i] = 0;
      }
      for (let i = 0; i < 8; i++) {
        this.ast_time_elapsed[i] = 0;
      }
    }

    const t = program_state.animation_time / 1000;
    const dt = program_state.animation_delta_time / 1000;

    if (!this.collision_detected) {
      this.update_state(dt);
      this.materials.road.shader.uniforms.offset +=
        ((this.game_speed / 2) * t - dt) / 450;
      this.materials.grass.shader.uniforms.offset +=
        ((this.game_speed / 2) * t - dt) / 15;
      this.materials.rainbow.shader.uniforms.offset +=
        ((this.game_speed / 2) * t - dt) / 90;
      this.materials.stars.shader.uniforms.offset +=
        ((this.game_speed / 2) * t - dt) / 750;
      this.materials.sky.shader.uniforms.offset +=
        ((this.game_speed / 2) * t - dt) / 900;
    }
    this.generate_traffic(context, program_state, (t - dt) / 5);

    this.generate_coins(context, program_state, t);
    this.checkCoinCollision();

    if (!this.collision_detected) {
      this.generateScore(context, program_state);
    } else {
      if (!this.soundPlayed) {
        this.sound.play();
      }
      this.soundPlayed = true;
      this.shapes.text.set_string(
        `Game Over! Your score is: ${this.score}`,
        context.context
      );
      this.shapes.text.draw(
        context,
        program_state,
        Mat4.identity()
          .times(Mat4.translation(-9, 5, 0))
          .times(Mat4.scale(0.5, 0.5, 0.5)),
        this.materials.text_image
      );
      this.shapes.text.set_string(`Press R to restart`, context.context);
      this.shapes.text.draw(
        context,
        program_state,
        Mat4.identity()
          .times(Mat4.translation(-5, 4, 0))
          .times(Mat4.scale(0.5, 0.5, 0.5)),
        this.materials.text_image
      );
    }

    const road_transform = this.road_transform.times(
      Mat4.translation(0, -0.5, 0)
    );

    const grass_left_transform = this.grass_left_transform.times(
      Mat4.translation(-1.1, -0.5, 0)
    );

    const grass_right_transform = this.grass_right_transform.times(
      Mat4.translation(1.1, -0.5, 0)
    );

    const sky_transform = this.sky_transform.times(
      Mat4.translation(0, 0, -500)
    );

    const moon_transform = this.moon_transform.times(
      Mat4.translation(0, 0, -50)
    );

    // const cone_transform = this.cone_transform.times(Mat4.translation(0,0,-100))

    if (this.grass_flag) {
      this.shapes.road.draw(
        // NORMAL ROAD
        context,
        program_state,
        road_transform,
        this.materials.road
      );

      this.shapes.sky.draw(
        //GRASS ON LEFT
        context,
        program_state,
        sky_transform,
        this.materials.sky
      );

      this.shapes.grass.draw(
        //GRASS ON LEFT
        context,
        program_state,
        grass_left_transform,
        this.materials.grass
      );

      this.shapes.grass.draw(
        // GRASS ON RIGHT
        context,
        program_state,
        grass_right_transform,
        this.materials.grass
      );
      this.generateHay(
        context,
        program_state,
        (this.game_speed / 2) * t - dt,
        (t - dt) / 5
      );
    } else if (this.rainbow_road_flag) {
      this.shapes.rainbow_road.draw(
        //RAINBOW ROAD
        context,
        program_state,
        road_transform,
        this.materials.rainbow
      );
      this.shapes.sky.draw(
        context,
        program_state,
        sky_transform,
        this.materials.stars
      );
      this.shapes.sphere4.draw(
        context,
        program_state,
        this.moon_transform,
        this.materials.moon
      );

      this.generateSpaceObjects(context, program_state, (t - dt) / 5);
    }

    this.cars[4].car.draw(
      context,
      program_state,
      this.car_transform,
      this.materials.car
    );

    // this.shapes.hay.draw(
    //   context,
    //   program_state,
    //   this.car_transform,
    //   this.materials.hay
    // );

    // this.shapes.cone.draw(
    //   context,
    //   program_state,
    //   cone_transform,
    //   this.materials.cone
    // )

    if (this.allow_collisions) {
      this.checkTrafficCollision();
    }
  }
}
