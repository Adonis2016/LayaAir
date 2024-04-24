#define SHADER_NAME CompositeVS
varying vec2 v_Texcoord0;
vec4 remapPositionZ(vec4 position)
{
    //position.z = position.z * 2.0 - position.w;
    #ifdef WEBGPU_COMPATIBLE
    position.y = -position.y;
    #else
    position.z = position.z * 2.0 - position.w;
    #endif
    return position;
}
void main() {
	gl_Position = vec4(a_PositionTexcoord.xy, 0.0, 1.0);
	v_Texcoord0 = a_PositionTexcoord.zw;
    #ifdef WEBGPU_COMPATIBLE
    v_Texcoord0.y = -v_Texcoord0.y;
    #endif
	gl_Position = remapPositionZ(gl_Position);
}