
 

Quick-cocos（3.2） 将对象（包括子对象）变灰的方法
evanstone0人评论1094人阅读2014-11-18 10:22:37
先上效果图：

wKiom1Rqqo7jT37vAAB8uJUMC70224.jpg



借鉴了[Cocos2d-x 让精灵图像变灰的方法]。



但这个方法在Quick-Cocos3.2下不能完美实现变灰效果－变灰了的对象的位置会跳到屏幕右上角。

百思不得其解，搜一下有没有人发现这个问题，果然有：

[关于Sprite的setShaderProgram后坐标改变的问题]

发现4楼的仁兄的回复有亮点：

[如何在Cocos2d-x 3.0中使用opengl shader？]

点进去一看，内容是这样的：

“坐标变化的解决了，将附件gray.vsh 中的CC_MVPMatrix 改为 CC_PMatrix 即可 ”



我估计应该是位置转换的矩阵问题吧，gray.vsh是什么下面会说到。



经过分析，发现原因在addGray方法（[Cocos2d-x 让精灵图像变灰的方法]）的27行：

pProgram->initWithVertexShaderByteArray(ccPositionTextureColor_vert, pszFragSource);


ccPositionTextureColor_vert是什么呢？它存放在cocos/renderer下，名为ccShader_PositionTextureColor.vert。它的作用是……以在下的理解，是一个shader方法(ccShader)，关于位置、材质与颜色的（PositionTextureColor）且是针对顶点的（.vert）。

它的内容是：

const char* ccPositionTextureColor_vert = STRINGIFY(
attribute vec4 a_position;
attribute vec2 a_texCoord;
attribute vec4 a_color;

\n#ifdef GL_ES\n
varying lowp vec4 v_fragmentColor;
varying mediump vec2 v_texCoord;
\n#else\n
varying vec4 v_fragmentColor;
varying vec2 v_texCoord;
\n#endif\n

void main()
{
    gl_Position = CC_MVPMatrix * a_position;
    v_fragmentColor = a_color;
    v_texCoord = a_texCoord;
}
);


咦，发现有一个熟悉的面孔－“CC_MVPMatrix”。其实上面说到的gray.vsh的内容就是ccShader_PositionTextureColor.vert大括号括住的部分。那我将ccShader_PositionTextureColor.vert的CC_MVPMatrix改为CC_PMatrix是否就能解决灰化后对象的位置问题呢？答案是否定的，这样改会影响其他对象（例如文本）的定位。

那我再定义一个GLchar传到pProgram->initWithVertexShaderByteArray的第一个参数不就得咯？

const GLchar* pszVertSource = 
	"attribute vec4 a_position; \n \
	attribute vec2 a_texCoord; \n \
	attribute vec4 a_color; \n \
	\n#ifdef GL_ES\n \n \
	varying lowp vec4 v_fragmentColor; \n \
	varying mediump vec2 v_texCoord; \n \
	\n#else\n \n \
	varying vec4 v_fragmentColor; \n \
	varying vec2 v_texCoord; \n \
	\n#endif\n \n \
	void main() \n \
	{ \n \
		gl_Position = CC_PMatrix * a_position; \n \
		v_fragmentColor = a_color; \n \
		v_texCoord = a_texCoord; \n \
	}";
  
pProgram->initWithVertexShaderByteArray(pszVertSource, pszFragSource);


经实践证实是可行的。其实有个更简单的方法，就是：

pProgram->initWithVertexShaderByteArray(ccPositionTextureColor_noMVP_vert, pszFragSource);


原来cocos/renderer下有个文件叫ccShader_PositionTextureColor_noMVP.vert。





最后附上实现灰化功能的全部代码。



C++部分，将此方法导出给lua用：

void setGray(Node *node)
{
  USING_NS_CC;
  do
  {
  	const GLchar* pszFragSource =
			"#ifdef GL_ES \n \
			precision mediump float; \n \
			#endif \n \
			uniform sampler2D u_texture; \n \
			varying vec2 v_texCoord; \n \
			varying vec4 v_fragmentColor; \n \
			void main(void) \n \
			{ \n \
			// Convert to greyscale using NTSC weightings \n \
			vec4 col = texture2D(u_texture, v_texCoord); \n \
			float grey = dot(col.rgb, vec3(0.299, 0.587, 0.114)); \n \
			gl_FragColor = vec4(grey, grey, grey, col.a); \n \
			}";
      
  	GLProgram* pProgram = new GLProgram();
  	pProgram->initWithByteArrays(ccPositionTextureColor_noMVP_vert, pszFragSource);
  	node->setGLProgram();
  	CHECK_GL_ERROR_DEBUG();
  }while(0);

}


lua部分：

--不进行灰化的对象特有的方法
DisplayUtil.LIST_DONT_GRAY = {
	"getSprite", 	--ProgressTimer
	"setString", 	--Label
}

--判断能否灰化
function DisplayUtil.canGray(node)
	for i,v in ipairs(DisplayUtil.LIST_DONT_GRAY) do
		if node[v] then
			return false
		end
	end
	return true
end

--灰化对象
function DisplayUtil.setGray(node, v)
	if type(node) ~= "userdata" then
		printError("node must be a userdata")
		return
	end
	if v == nil then
		v = true
	end
	if not node.__isGray__ then
		node.__isGray__ = false
	end
	if v == node.__isGray__ then
		return
	end
	if v then
		if DisplayUtil.canGray(node) then
    	--调用C++的setGray方法
			setGray(tolua.cast(node, "cocos2d::Node"))
			--
			-- local glProgram = node:getGLProgram()
			-- node:setGLProgram(glProgram)
			-- node:getGLProgram():bindAttribLocation(cc.ATTRIBUTE_NAME_POSITION, cc.VERTEX_ATTRIB_POSITION)
			-- node:getGLProgram():bindAttribLocation(cc.ATTRIBUTE_NAME_COLOR, cc.VERTEX_ATTRIB_COLOR)
			-- node:getGLProgram():bindAttribLocation(cc.ATTRIBUTE_NAME_TEX_COORD, cc.VERTEX_ATTRIB_TEX_COORDS)

			--不知道为什么下面2行一定要写
			node:getGLProgram():link()
			node:getGLProgram():updateUniforms()
		end
		--children
		local children = node:getChildren()
		if children and table.nums(children) > 0 then
			--遍历子对象设置
			for i,v in ipairs(children) do
				if DisplayUtil.canGray(v) then
					DisplayUtil.setGray(v)
				end
			end
		end
	else
		DisplayUtil.removeGray(node)
	end
	node.__isGray__ = v
end



--取消灰化
function DisplayUtil.removeGray(node)
	if type(node) ~= "userdata" then
		printError("node must be a userdata")
		return
	end
	if not node.__isGray__ then
		return
	end
	if DisplayUtil.canGray(node) then
		local glProgram = cc.GLProgramCache:getInstance():getGLProgram(
			"ShaderPositionTextureColor_noMVP")
		node:setGLProgram(glProgram)
		-- glProgram:bindAttribLocation(cc.ATTRIBUTE_NAME_POSITION, cc.VERTEX_ATTRIB_POSITION)
		-- glProgram:bindAttribLocation(cc.ATTRIBUTE_NAME_COLOR, cc.VERTEX_ATTRIB_COLOR)
		-- glProgram:bindAttribLocation(cc.ATTRIBUTE_NAME_TEX_COORD, cc.VERTEX_ATTRIB_TEX_COORDS)

		--不知道为什么下面2行不能写，写了会出问题
		-- glProgram:link()
		-- glProgram:updateUniforms()
	end
	--children
	local children = node:getChildren()
	if children and table.nums(children) > 0 then
		--遍历子对象设置
		for i,v in ipairs(children) do
			if DisplayUtil.canGray(v) then
				DisplayUtil.removeGray(v)
			end
		end
	end
	node.__isGray__ = false
end


怎么使用不用我多说了吧。

©著作权归作者所有：来自51CTO博客作者evanstone的原创作品，如需转载，请注明出处，否则将追究法律责任
cocos2d-xquick-xquick-x灰化对象Quick-cocos
0
分享

收藏
下一篇：VS2013+python+bo...
 evanstone
2篇文章，1W+人气，0粉丝

提问和评论都可以，用心的回复会被更多人看到和认可
Ctrl+Enter 发布发布取消
