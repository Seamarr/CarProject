import { tiny, defs } from "./objects.js";
import { Shape_From_File } from './examples/obj-file-demo.js';

const { Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture, } = tiny;

const {Textured_Phong} = defs

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
        road: new defs.Cube(),
        car: new Shape_From_File("assets/10600_RC_Car_SG_v2_L3.obj"),
        tree: new defs.Box(5,10,3),
        leaves: new defs.Box(5,5,5),
    };

      this.shapes.road.arrays.texture_coord.forEach(p => p.scale_by(1));

    // *** Materials
    this.materials = {
      test: new Material(new defs.Phong_Shader(), {
        ambient: 0.4,
        diffusivity: 0.6,
        color: hex_color("#ffffff"),
      }),
      car: new Material(new Textured_Phong(1), {
          color: color(0.5, 0.5, 0.5, 1),
          ambient: 0.8, diffusivity: 0.5, specularity: .5, texture: new Texture("assets/10600_RC_Car_SG_v1_diffuse.jpg")
      }),
      road: new Material(new Texture_Scroll_X(), {
        color: hex_color("#000000"),
          ambient: 1, diffusivity: 0.1, specularity: .5, texture: new Texture("assets/road.png")
      }),
      tree: new Material(new defs.Phong_Shader(), {
          color: hex_color("#964B00"),
          ambient: 1,
        }),
        leaves: new Material(new defs.Phong_Shader(), {
            color: hex_color("#00FF00"),
            ambient: 1,
        }),
    };

    this.initial_camera_location = Mat4.look_at(
      vec3(0, 5, 20),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );

    this.time_elapsed_1=0;
    this.time_elapsed_2=0;


    this.car_transform = Mat4.identity();
    this.road_transform = Mat4.identity();
    this.tree_transform_1=Mat4.identity();
    this.tree_transform_2=Mat4.identity();


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
        this.coefficient_of_friction /= 1.2;
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
        this.coefficient_of_friction *= 1.2;
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
    this.car_transform = Mat4.translation(...this.car_position)
        .times(Mat4.rotation(this.current_tilt, 0, 1, 0))
        .times(Mat4.translation(0, 0.7, 0))
        .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
        .times(Mat4.rotation(Math.PI, 0, 1, 0))
        .times(Mat4.scale(2, 2, 2));
      // Rotation around the Y-axis for tilt

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
    if (this.car_acceleration[0] === 0 && !this.car_velocity[0] === 0) {
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

    const road_transform = this.road_transform
        .times(Mat4.translation(0, -7, 0))
        .times(Mat4.scale(20, 0.1, 500));

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


   const original_tree_position_1 = -140;
   const original_tree_position_2 = -200;


      this.tree_transform_1 = this.road_transform.times(Mat4.translation(18, 0, original_tree_position_1));

    if (5* (t-this.time_elapsed_1)  <= (Math.abs(original_tree_position_1)/this.acceleration_rate) + 2){
       this.tree_transform_1=this.tree_transform_1.times(Mat4.translation(0,0,5 * this.acceleration_rate*(t-this.time_elapsed_1)));
    }
    else{
        this.time_elapsed_1=t;
    }
    this.shapes.tree.draw(
            context,
            program_state,
            this.tree_transform_1,
            this.materials.tree
    );

      this.tree_transform_2=this.road_transform.times(Mat4.translation(-18,0,original_tree_position_2));

      if (5* (t-this.time_elapsed_2)  <= (Math.abs(original_tree_position_2)/this.acceleration_rate) + 2){
          this.tree_transform_2=this.tree_transform_2.times(Mat4.translation(0,0,5 * this.acceleration_rate*(t-this.time_elapsed_2)));
      }
      else{
          this.time_elapsed_2=t;
      }
      this.shapes.tree.draw(
          context,
          program_state,
          this.tree_transform_2,
          this.materials.tree
      );

      this.tree_transform_1 = this.tree_transform_1.times(Mat4.translation(-5, 5, 0));
      this.tree_transform_2 = this.tree_transform_2.times(Mat4.translation(5, 5, 0));

      for (let i=0; i<4; i++){
          this.shapes.leaves.draw(
              context,
              program_state,
              this.tree_transform_1,
              this.materials.leaves
          );
          this.shapes.leaves.draw(
              context,
              program_state,
              this.tree_transform_2,
              this.materials.leaves
          );
          this.tree_transform_1 = this.tree_transform_1.times(Mat4.translation(5,0, 0)) // Translate to origin
              .times(Mat4.rotation(Math.PI / 2, 0, 1, 0)) // Rotate around origin
              .times(Mat4.translation(-5, 0, 0)); // Translate back

          this.tree_transform_2 = this.tree_transform_2.times(Mat4.translation(-5, -5, 0)) // Translate to origin
              .times(Mat4.rotation(Math.PI / 2, 0, 1, 0)) // Rotate around origin
              .times(Mat4.translation(5, 5, 0)); // Translate back
      }
  }
}

class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){ //got help in office hours for Question 6 and 8
                vec2 slide_tex_coord; 
                slide_tex_coord.x = f_tex_coord.x * 50.0;
                slide_tex_coord.y = f_tex_coord.y * 0.01 + (-2.0 * animation_time);
                // Sample the texture image in the correct place:
                vec4 tex_color = texture2D( texture, slide_tex_coord);
                
                //got black box from discussion slides
                float u = mod(slide_tex_coord.x, 1.0);
                float v = mod(slide_tex_coord.y, 1.0);
                //float distance_to_center = 0.25;
                //drew a graph on a piece of paper
                //Ex: left edge 0.3/2 < u < 0.5/2 && 0.3/2 < v < 1 - 0.3/2 
                if (u > 0.05 && u < 0.25 && v > 0.15 && v < 0.85) { tex_color = vec4(1.0, 1.0, 1.0, 1.0); }
                //if (u > 0.75 && u < 0.85 && v > 0.15 && v < 0.85) { tex_color = vec4(0, 0, 0, 1.0); }
                //if (v > 0.15 && v < 0.25 && u > 0.15 && u < 0.85) { tex_color = vec4(0, 0, 0, 1.0); }
                //if (v > 0.75 && v < 0.85 && u > 0.15 && u < 0.85) { tex_color = vec4(0, 0, 0, 1.0); }
                
                if( tex_color.w < .01 ) discard;
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}


class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){ //got help in office hours for Question 7 and 8
                //dt * 10 * (2*Math.PI/60)
                float angle = 20.0 * (2.0 * 3.14159265359 / 60.0) * animation_time; 
                mat4 rot_matrix = mat4(
                    vec4(cos(angle), sin(angle), 0.0, 0.0),
                    vec4(sin(angle), -cos(angle), 0.0, 0.0),
                    vec4( 0.0, 0.0, 1.0, 0.0), 
                    vec4( 0.0, 0.0, 0.0, 1.0)
                    );
                //logic: translate to origin, rotate, inverse translate
                //inspired by parts of the discussion
                vec4 rot_tex_coord; 
                rot_tex_coord.x = f_tex_coord.x - 0.5;
                rot_tex_coord.y = f_tex_coord.y - 0.5;
                rot_tex_coord.z = 1.0;
                rot_tex_coord.w = 1.0;
                rot_tex_coord = (rot_matrix * rot_tex_coord);
                rot_tex_coord.x = rot_tex_coord.x + 0.5;
                rot_tex_coord.y = rot_tex_coord.y + 0.5;
                // Sample the texture image in the correct place:
                
                vec4 tex_color = texture2D( texture, rot_tex_coord.xy );
                
                //got black box from discussion slides
                float u = mod(rot_tex_coord.x, 1.0);
                float v = mod(rot_tex_coord.y, 1.0);
                //float distance_to_center = 0.25;
                //drew a graph on a piece of paper
                //Ex: left edge 0.3/2 < u < 0.5/2 && 0.3/2 < v < 1 - 0.3/2 
                if (u > 0.15 && u < 0.25 && v > 0.15 && v < 0.85) { tex_color = vec4(0, 0, 0, 1.0); }
                if (u > 0.75 && u < 0.85 && v > 0.15 && v < 0.85) { tex_color = vec4(0, 0, 0, 1.0); }
                if (v > 0.15 && v < 0.25 && u > 0.15 && u < 0.85) { tex_color = vec4(0, 0, 0, 1.0); }
                if (v > 0.75 && v < 0.85 && u > 0.15 && u < 0.85) { tex_color = vec4(0, 0, 0, 1.0); }
                
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}