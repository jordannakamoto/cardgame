export default class OutlinePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            renderTarget: true,
            fragShader: `
                precision mediump float;
                
                uniform sampler2D uMainSampler;
                uniform vec2 uResolution;
                uniform vec3 uOutlineColor;
                uniform float uOutlineThickness;
                
                varying vec2 outTexCoord;
                
                void main() {
                    vec2 texelSize = 1.0 / uResolution;
                    vec4 color = texture2D(uMainSampler, outTexCoord);
                    
                    // If current pixel is not transparent, just return it
                    if (color.a > 0.0) {
                        gl_FragColor = color;
                        return;
                    }
                    
                    // Check surrounding pixels for alpha > 0
                    float outline = 0.0;
                    
                    // Fixed sample pattern (smaller for subtlety)
                    for (int x = -1; x <= 1; x++) {
                        for (int y = -1; y <= 1; y++) {
                            if (x == 0 && y == 0) continue;
                            
                            vec2 samplePos = outTexCoord + vec2(float(x), float(y)) * texelSize;
                            vec4 sampleColor = texture2D(uMainSampler, samplePos);
                            
                            if (sampleColor.a > 0.0) {
                                outline = 1.0;
                                break;
                            }
                        }
                        if (outline > 0.0) break;
                    }
                    
                    // If we found a non-transparent pixel nearby, draw subtle outline
                    if (outline > 0.0) {
                        gl_FragColor = vec4(uOutlineColor, 0.6);
                    } else {
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                    }
                }
            `
        });
    }
    
    onPreRender() {
        this.set3f('uOutlineColor', 0.0, 0.0, 0.0); // Black outline
        this.set1f('uOutlineThickness', 2.0); // 2 pixel thickness
        this.set2f('uResolution', this.renderer.width, this.renderer.height);
    }
    
    setOutlineColor(r, g, b) {
        this.set3f('uOutlineColor', r, g, b);
    }
    
    setOutlineThickness(thickness) {
        this.set1f('uOutlineThickness', thickness);
    }
}