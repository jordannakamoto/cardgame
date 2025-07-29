export class GlassmorphismShader extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            name: 'GlassmorphismShader',
            fragShader: `
                precision mediump float;
                
                uniform sampler2D uMainSampler;
                uniform vec2 uResolution;
                uniform vec4 uGlassRect; // x, y, width, height of glass area (normalized)
                uniform float uBlurAmount;
                
                varying vec2 outTexCoord;
                
                void main() {
                    vec2 uv = outTexCoord;
                    vec4 color = texture2D(uMainSampler, uv);
                    
                    // Check if we're in the glass area
                    vec2 glassMin = uGlassRect.xy;
                    vec2 glassMax = uGlassRect.xy + uGlassRect.zw;
                    
                    if (uv.x >= glassMin.x && uv.x <= glassMax.x && 
                        uv.y >= glassMin.y && uv.y <= glassMax.y) {
                        
                        // Apply blur effect in glass area
                        vec4 blurColor = vec4(0.0);
                        float samples = 9.0;
                        float offset = uBlurAmount * 0.001;
                        
                        // Simple box blur
                        for (float x = -1.0; x <= 1.0; x += 1.0) {
                            for (float y = -1.0; y <= 1.0; y += 1.0) {
                                vec2 sampleUV = uv + vec2(x * offset, y * offset);
                                blurColor += texture2D(uMainSampler, sampleUV);
                            }
                        }
                        
                        color = blurColor / samples;
                        
                        // Add slight tint and transparency for glass effect
                        color.rgb = mix(color.rgb, vec3(1.0, 1.0, 1.0), 0.1);
                        color.a *= 0.9;
                    }
                    
                    gl_FragColor = color;
                }
            `
        });
        
        this.glassRect = { x: 0.3, y: 0.3, w: 0.4, h: 0.4 };
        this.blurAmount = 8.0;
    }
    
    onPreRender() {
        this.set2f('uResolution', this.renderer.width, this.renderer.height);
        this.set4f('uGlassRect', this.glassRect.x, this.glassRect.y, this.glassRect.w, this.glassRect.h);
        this.set1f('uBlurAmount', this.blurAmount);
    }
    
    setGlassArea(x, y, width, height, gameWidth, gameHeight) {
        // Convert pixel coordinates to normalized UV coordinates
        this.glassRect.x = x / gameWidth;
        this.glassRect.y = y / gameHeight;
        this.glassRect.w = width / gameWidth;
        this.glassRect.h = height / gameHeight;
    }
    
    setBlurAmount(amount) {
        this.blurAmount = amount;
    }
}