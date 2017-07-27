# 开发说明

## 项目目录结构

```
    - bower_components              bower依赖文件默认安装目录
    - docs                          存放文件目录
    - hooks                         Cordova hooks
    - node_modules                  npm依赖包安装目录
    - rev                        
        - css                       
        - js
    - scss                          scss文件
        + ionic.app.scss            ionic的scss主文件
        + main.scss                 自定义文件的主文件             
        - common                    公共的scss文件库
            + _base.scss            基本scss
            + _mixin.scss           mixin scss
            + _reset.scss           清除默认样式的scss
            + _var.scss             定义变量的文件
        - view                      自定义模块的scss
        - widget                    小组件的样式文件
            + _button.scss          button样式
    - staticfiles                   静态网页存储目录
        - img                       静态网页所需图片
        + [.html]                    相关html
    - www                           项目主体文件
        - [projectName]             项目名
            - [module]              各个modules
            + app.js                enter js
        - common                    公共的组件
            - directives            指令
            - filters               拦截器
            - interceptors          
            - mockdata              模拟json数据
            - services              services
        - css                       生成后的css
        - img                       图片目录
        - lib                       依赖包文件
            - angular               angular相关依赖
            - angular-animate       angular-animate插件
            - angular-ui-router     angular-ui-router插件
            - ionic                 ionic相关组件
            - ng-file-upload        angular上传文件插件
            - underscore            underscore工具组件
            + index.html            ionic入口示例文件
        + .gitignore                gitignore
        + bower.json                bower依赖的配置文件
        + config.xml                ionic配置文件
        + DEVELOPMENT.md            开发人员阅读的开发说明
        + gulpfile.js               gulp配置文件
        + ionic.project             ionic项目的相关配置
        + package.json              npm依赖包得配置文件
        + README.md                 项目运行的相关说明 
         
    `注意: + 代表文件，- 代表目录`
```

## 代码规范

1. 缩进使用4空格
2. 文件编码设为`utf-8`

### html

1. id用下划线“_”分割
2. class用横线“-”分割
3. name用驼峰法
4. 缩进使用4空格
5. 所有tagname小写
6. 所有标签必须闭合（包括标准中可省略部分）
7. doctype使用<!DOCTYPE html>
8. 样式写在或者外链在head标签中

例如:

```
	示例
```

### scss

1. 文件命名规范：
    * 命名以下划线开头
    * 命名采用驼峰式命名
    * 例：
        * _myStyle.scss
2. 文件中变量定义规范（具体也可参照scss->main.scss中的相关注释说明）：
    * 全局变量不以下划线开头
    * 子模块中内部使用变量以下划线开头
    * color变量定义（参见scss->main.scss）
    * font变量定义（参见scss->main.scss）
    * 例：
        * $color-80: #808080;
        * $_ms-color-80: #808080;
        * $font-80: 80px;
        * $_ms-font-80: 80px;
3. 类名以“-”作为分隔符
    * 例：
        * .my-gray-button
4. 嵌套尽量不超过三层
5. 子模块_name.scss需要import到main.scss

### javascript


### images

TODO:
    1. 图片通过脚本制作成sprite图


## 命令
    下述命令若无特殊说明，均在项目根目录下执行

### scss编译
    gulp

把scss目录下所有(除ionic.app.scss)的文件均编译为css放到www->css->main.css(main.min.css)

