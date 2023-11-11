
//
// used for automatical complement
if(__build__!==1){
    const layui = require("./layui/layui.js");
    const lex = require("./lex.js");
    const codes = require('./codes.js');
}

const parent_node = '    <li lay-options="{id: 101}">\
<div class="layui-menu-body-title"><a href="javascript:;">menu item 1</a></div>\
</li>'

var examples = new Map();

function add_code_menu(name,codes=''){
    document.getElementById("code-menu").innerHTML += parent_node.replace(/menu item 1/g, name);
    examples.set(name,codes);
}

function add_log(str,clean=false){
  var x =document.getElementById('codelog');
  if(clean){
    x.value='';
  }
  x.value+=str+'\n';
}

function input_handle(){
  var codes = document.getElementById('codeinput').value;
  if(gvm.inputting){
    gvm.vars.set(gvm.inputname,{type:'str',val:codes});
    gvm.inputting=false;
    document.getElementById('runbtn').setAttribute('class','layui-icon layui-icon-triangle-r layui-btn layui-bg-cyan');
    execute(undefined,undefined,true);
  }
}

function code_run(){
  add_log('',true);
  var codes = document.getElementById('codeeditor').value;
  try{
    const a = tokenize(codes_stdlib+'\n'+codes+'\n',add_log);
    console.log(a);
    execute(a,add_log);
  }catch(e){
    add_log('Lexical ERROR:\n'+e);
  }
  
}

layui.use(function(){
    
    var dropdown = layui.dropdown;
    var layer = layui.layer;
    var util = layui.util;
    add_code_menu('新建空的代码区域',codes_empty);
    add_code_menu('变量/数组/常量 定义/赋值',codes_def);
    add_code_menu('各种运算',codes_calc);
    add_code_menu('各种循环',codes_loops);
    add_code_menu('输出(output)',codes_hello_world);
    add_code_menu('输入(input)',codes_input);
    add_code_menu('if-else',codes_branches);
    add_code_menu('caseof',codes_case);
    add_code_menu('函数定义/调用',codes_fdef);
    add_code_menu('冒泡排序（非高效版）',codes_bubble);
    // 菜单点击事件
    dropdown.on('click(code-menu)', function(options){
      console.log(this, options);
      
      // 显示 - 仅用于演示
      const name = options.title;
      const codes = examples.get(name);
      if(codes !== undefined){
        document.getElementById('codeeditor').value = codes;
      }
    });
  });