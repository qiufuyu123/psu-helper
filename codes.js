const codes_stdlib = "\
CONSTANT true = 1 and 1\n\
CONSTANT false = 0 and 0\n\
CONSTANT otherwise = '__otherwise__'\n\
function length(x:string)\n\
declare i:integer\n\
i<-0\n\
while (x[i] <> 'undefined') do\n\
i<-i+1\n\
endwhile\n\
return i\n\
endfunction\n\
function mid(x:string,m:integer,n:integer)\n\
declare o:string\n\
o<-\"\"\n\
for i<-1 to n\n\
if x[m-2+i] = 'undefined' then\n\
return o\n\
else\n\
o<-o&x[m-2+i]\n\
endif\n\
endfor\n\
return o\n\
endfunction\n\
function left(x:string,n:integer)\n\
return mid(x,1,n)\n\
endfunction\n\
function right(x:string,n:integer)\n\
return mid(x,length(x)-n+1,n)\n\
endfunction\n\
function str(x:real)\n\
return ''&x\n\
endfunction\n\
function RANDOMBETWEEN(min:integer,max:integer)\n\
return int(rnd()*(max-min))+min\n\
endfunction\n\
function div(x:real,y:real)\n\
return int(x/y)\n\
endfunction\n\
"

const codes_empty = "\
# 欢迎，这是一个空的代码示例\n\
# 可以使用 '#' 注释, 写下代码后，点击[RUN]按钮即可\n\
";

const codes_hello_world = "\
# OUTPUT 函数可以输出 字符串 数字 到页面的[OUTPUT]框中\n \
# 例如，以下代码实现helloworld!\n\
OUTPUT \"Hello World!\"\
";
const codes_input = "\
# INPUT 函数可以获取用户输入的字符串\n\
# 当你使用时，程序会在运行到INPUT时暂停，等待用户在INPUT框中输入内容\n\
# 用户输入完内容后，可以点击[发送INPUT]完成input内容的输入\n\
\n\
declare x:string  #这里我们定义一个变量来保存input的值\n\
input x\n\
output \"你输入的是\" & x\n\
  ";

const codes_branches = "\
# 条件语句\n\
# 1. IF 语句:\n\
#    \n\
declare a:integer\n\
a <- 233\n\
IF a = 233 THEN\n\
OUTPUT \"对啦！\"\n\
ELSE \n\
OUTPUT \"你输入的不是233哦~\"\n\
ENDIF\n\
"
const codes_def = "\
# 各种变量定义/赋值\n\
# 普通变量:\n\
declare a:string\n\
declare b:integer\n\
declare c:real\n\
declare d:boolean\n\
# 数组变量\n\
declare e:array[1:10] of integer\n\
declare f:array[1:10,1:10] of string\n\
# 常量\n\
CONSTANT X = 23\n\
# 赋值\n\
a<-'a'\n\
b<-2\n\
c<-2.2\n\
d<-true\n\
e[1] <- 2\n\
f[2,2] <- 'b'\n\
\n\
output a\n\
output b\n\
output c\n\
output d & \"(true)\"\n\
output e[1]\n\
output f[2,2]\n\
output X\n\
"

const codes_case = "\
# CASE OF 语句:\n\
\n\
declare x : integer\n\
x <- 1\n\
CASE OF x\n\
   1: output '这是一'\n\
   2: output '这是二'\n\
   otherwise: output '这不是1或2'\n\
ENDCASE\n\
"

const codes_calc = "\
# 数学运算：\n\
output 1+1\n\
output 2*3\n\
output 3/4\n\
output 3*4\n\
output 4%3\n\
output 4^2\n\
output div(3,2)\n\
output 2>1\n\
output 2>=2\n\
output 2<1\n\
output 2<=1\n\
# 逻辑运算\n\
output true and true\n\
output true and false\n\
output false and false\n\
output true or true\n\
output true or false\n\
output false or false\n\
output not false \n\
output not true \n\
"

const codes_loops = "\
# pre-condition\n\
declare cnt:integer\n\
cnt<-3\n\
while cnt>0 do\n\
output cnt\n\
cnt<-cnt-1\n\
endwhile\n\
\n\
# post-condition\n\
cnt<-3\n\
repeat \n\
output cnt\n\
cnt<-cnt-1\n\
until cnt=0\n\
\n\
# counted-loop\n\
for i<-1 to 10 step 2\n\
output i\n\
endfor\n\
"

const codes_fdef = "\
# 函数定义\n\
function add(a:integer,b:integer) returns integer\n\
return a+b\n\
endfunction\n\
output '调用函数(add) 参数:2,3 结果：' & add(2,3)\n\
# PROCEDURE定义\n\
procedure print(x:string)\n\
output x\n\
endprocedure\n\
call print(\"233\")\n\
"

const codes_bubble = "\
declare nums:array[1:10] of integer\n\
for i<-1 to 10 \n\
nums[i]<-randombetween(1,11)\n\
endfor\n\
output '排序前：'\n\
for i<-1 to 10\n\
output nums[i]\n\
endfor\n\
output '开始'\n\
#冒泡\n\
declare tmp:integer\n\
for i<-1 to 10\n\
    for j<-1 to 10 - i\n\
        if nums[j+1] < nums[j] then\n\
            tmp<-nums[j+1]\n\
            nums[j+1]<-nums[j]\n\
            nums[j]<-tmp\n\
        endif\n\
    endfor\n\
endfor\n\
output '排序后：'\n\
for i<-1 to 10\n\
output nums[i]\n\
endfor\n\
"