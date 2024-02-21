import { tiny } from "./examples/common.js";

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
    super();
    // Define your road, car shapes, and any basic materials here
  }

  make_control_panel() {
    // Define any controls for your game here
  }

  display(context, program_state) {
    // Main display loop for the game
    // Setup camera and any global transformations
    // Draw your road and car here
  }
}
