import Phaser from 'phaser';

const commonFoilShader = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float tiltAmount;
uniform float tiltAngle;
varying vec2 outTexCoord;

void main() {
    vec2 uv = outTexCoord;
    vec4 texColor = texture2D(uMainSampler, uv);

    // Calculate flow direction based on tilt angle
    vec2 flowDir = vec2(cos(tiltAngle), sin(tiltAngle));
    
    // Directional shimmer lines that flow with the tilt
    float flowCoord = dot(uv - 0.5, flowDir) + tiltAmount * 0.5;
    float shimmer = sin(flowCoord * 15.0) * 0.5 + 0.5;
    shimmer = pow(shimmer, 2.0) * tiltAmount; // Intensity based on tilt amount
    
    // Perpendicular waves for cross-hatching effect
    float perpCoord = dot(uv - 0.5, vec2(-flowDir.y, flowDir.x)) + tiltAmount * 0.3;
    float crossWave = sin(perpCoord * 8.0) * 0.5 + 0.5;
    crossWave = pow(crossWave, 3.0) * tiltAmount * 0.6;
    
    // Rainbow interference that follows the flow
    float rainbow = sin(flowCoord * 10.0 + tiltAmount * 2.0) * 0.3 + 0.7;
    vec3 rainbowColor = vec3(
        sin(rainbow + 0.0) * 0.5 + 0.5,
        sin(rainbow + 2.09) * 0.5 + 0.5, 
        sin(rainbow + 4.18) * 0.5 + 0.5
    );
    
    // Combine effects
    float totalHighlight = shimmer * 0.5 + crossWave * 0.3;
    
    // Blend foil effects with original texture - more subtle
    vec3 foilColor = texColor.rgb * (1.0 + totalHighlight * 0.2);
    foilColor += rainbowColor * totalHighlight * 0.08;
    foilColor += vec3(1.0, 1.0, 1.0) * totalHighlight * 0.12; // White highlights
    
    gl_FragColor = vec4(foilColor, texColor.a);
}
`;

/**
 * Simple foil pipeline using SinglePipeline like before
 */
export default class FoilPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
    constructor(config) {
        super({
            game: config.game,
            renderer: config.renderer,
            fragShader: commonFoilShader
        });

        this._tiltAmount = 0;
        this._tiltAngle = 0;
    }
    
    onBind(gameObject) {
        super.onBind(gameObject);
        
        if (this.set1f) {
            this.set1f('tiltAmount', this._tiltAmount);
            this.set1f('tiltAngle', this._tiltAngle);
        }
    }
    
    setTilt(amount, angle) {
        this._tiltAmount = amount;
        this._tiltAngle = angle;
    }
}