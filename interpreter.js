//
// 词法分析器
//
function isdigit(c){
    return c>='0' && c<='9';
}

function issym(s){
    return ['.',':','(',')','[',']',','].includes(s);
}

function iscalc(c){
    return ['+','-','*','/','=','&','<','>','%','^'].includes(c);
}

function iskwd(s){
    return ['procedure','endprocedure','if','then','else','endif','while','do','endwhile','for','step','endfor'
            ,'declare','input','output','constant','case','repeat','until','function','endfunction','call','returns','return'].includes(s);
}

function gentoken(t,v,c){
    return {type:t,val:v,col:c};
}

function isword(c){
    return (c>='A' && c<='Z')||(c>='a' && c<='z') || ['_'].includes(c);
}

/**
 * 
 * @param {string} codes 
 * @param {function} log 
 */

//40col for stdlib
function tokenize(codes,log){
    lineno = -38;
    var res = []
    for(var i = 0;i<codes.length;++i){
        let c = codes[i];
        if(isdigit(c)){
            //number
            var num = '';
            while(isdigit(c) || c === '.'){
                num+=c;
                c = codes[++i];
            }
            i--;
            res.push(gentoken('number',num.includes('.')?Number.parseFloat(num):Number.parseInt(num),lineno));
        }else if(iscalc(c)){
            res.push(gentoken('calc',c,lineno));
        }else if(issym(c)){
            res.push(gentoken('sym',c,lineno))
        }
        else if(c === '\n'){{
            res.push(gentoken('newline','',lineno));
            lineno++;
        }
        }else if(isword(c)){
            var tmp='';
            while(isword(c)){
                tmp+=c;
                c=codes[++i];
            }
            i--;
            tmp=tmp.toLowerCase();
            res.push(gentoken(iskwd(tmp)?'kwd':'wd',tmp,lineno));
        }else if(c === '\'' || c === '"'){
            const j = codes.indexOf(c,i+1);
            if(j === -1){
                throw '字符串未闭合（少了引号？），在第'+lineno+'行';
            }
            res.push(gentoken('string',codes.substring(i+1,j),lineno));
            i+=(j-i);
        }
        else if(c === ' ')
            continue;
        else if(c === '#'){
            while(codes[++i] !== '\n')
                continue;
            res.push(gentoken('newline','',lineno));
            lineno++;
        }else{
            throw '未知的字符:"'+c+'",在第'+lineno+'行';
        }
    }
    return res;
}



var gvm = {
    tkidx:0,
    
    tokens:[],
    vars:null,
    stacks:[],
    stop:false,
    inputting:false,
    inputname:'',
    output:null,
    loopcnt:0,
    returnv:null
};

function cleangvm(tks){
    gvm.tkidx = 0;
    gvm.tokens = tks;
    gvm.vars = new Map();
    gvm.stop = false;
    gvm.inputting = false;
    gvm.loopcnt = 0;
    gvm.stacks = [];
    gvm.returnv = nil_val;
}

function next(e = true){
    if(gvm.tkidx>=gvm.tokens.length && e)
        throw '你的代码异常结束（确定结尾没少些什么东西吗:)';
    return gvm.tokens[gvm.tkidx++];
}

function peek(val){
    if(gvm.tkidx>=gvm.tokens.length)
        throw '你的代码异常结束（确定结尾没少些什么东西吗:)';
    return gvm.tokens[gvm.tkidx].val === val;
}

function match(type){
    if(gvm.tkidx>=gvm.tokens.length)
        throw '你的代码异常结束（确定结尾没少些什么东西吗:)';
    return gvm.tokens[gvm.tkidx].type === type;
}

function eat(val){
    if(next().val !== val)
        throw '缺少 `'+val+'`';
}

function tobool(v){
    if(v.type === 'real' || v.type === 'integer'){
        return v.val === 0 ? false:true;
    }else if(v.type !== 'bool'){
        throw '类型：'+v.type+'，无法转换为bool!';
    }
    return v.val;
}

var parser_table = new Map();
var syscall_table = new Map();

parser_table.set('constant',function(){
    if(!match('wd')){
        throw '在constant后需要变量的名称!';
    }
    const name = next().val;
    eat('=');
    const v = expr(4);
    gvm.vars.set(name,{type:v.type,val:v.val});
});

function cvt_type(type){
    if(type === 'char'){
        return 'string'; // haha
    }
    if(type === 'boolean'){
        return 'bool';
    }
    return type;
}

function getValsTable(split = false){
    var vals = new Map();
    while(true){
        if(!match('wd')){
            throw '在declare后需要变量的名称!';
        }
        const id = next().val;
        eat(':')
        if(!match('wd')){
            throw '在 `:` 后缺少类型名称';
        }
        var type = cvt_type(next().val);
        if(type === 'array'){
            // array
            eat('[');
            var dimensions = [];
            while(true){
                if(!match('number')){
                    throw '缺少数组长度!';
                }
                const left = next().val;
                eat(':')
                if(!match('number')){
                    throw '缺少数组边界(必须为常数，不接受变量或常量）!';
                }
                const right = next().val;
                dimensions.push({l:left,r:right});
                if(!peek(',')){
                    break;
                }
                next();
            }
            eat(']')
            eat('of');
            if(!match('wd')){
                throw '缺少数组的类型名!';
            }
            const type = cvt_type(next().val);
            vals.set(id,gentoken('array',{type:type,val:dimensions,ctx:new Map()}));
        }else{
            vals.set(id,gentoken(type,0));
        }
        const nxt = next();
        if(split && nxt.val !== ','){
            gvm.tkidx--;
            return vals;
        }else{
            if(nxt.type === 'newline' || nxt.val === split)
                return vals;
            else if(nxt.val !== ','){
                throw '这里需要 换行 来结束变量的声明!';
            }
        }
    }
}

parser_table.set('declare',function(){
    const tables = getValsTable();
    console.log(tables);
    tables.forEach((v,k) => {
        console.log('dec:'+k+' , '+v);
        gvm.vars.set(k,v);
    });
});

parser_table.set('call',function(){
    if(!match('wd')){
        throw '缺少要调用的过程名!';
    }

});

function fdecl(proced = false){
    if(!match('wd')){
        throw '缺少要调用的函数名!';
    }
    const name = next().val;
    eat('(')
    var params = new Map();
    if(!peek(')')){
        params = getValsTable(true);
    }
    eat(')')
    if(peek('returns')){
        if(proced){
            throw 'PROCEDURE不能有返回值，请考虑function';
        }
        next();
        if(!match('wd')){
            throw 'RETURNS后需要 类型';
        }
        next();
    }
    const idx =gvm.tkidx;
    console.log('idx:'+idx);
    while(!peek('endfunction') && !peek('endprocedure'))
        next();
    next();
    gvm.vars.set(name,{type:'func',val:{parm:params,pc:idx}});
}

parser_table.set('call',function(){
    return  true;
});

parser_table.set('function',function(){
    fdecl();
});

parser_table.set('procedure',function(){
    fdecl(true);
});

parser_table.set('case',function(){
    eat('of');
    const v = expr(4);
    var tmp = {type:'bool',val:false};
    var s = 0;
    while(true){
        if(peek('endcase')){
            next();
            break;
        }
        if(peek(':')){
            if(s){
                s = 2;
                next();
                continue;
            }
            while(gvm.tokens[gvm.tkidx].type !== 'newline'){
                gvm.tkidx--;
            }
            next();
            const r = expr(4);
            if((cmptype(v,r) && v.val === r.val) || r.val === '__otherwise__'){
                s=1;
            }else{
                s=0;
            }
            next();// 跳过 :
        }else{
            if(s == 1){
                process();
            }else{
                next();
            }
        }
    }
    
});

parser_table.set('repeat',function(){
    if(gvm.loopcnt>=500){
        gvm.loopcnt = 0;
        throw '循环次数超过500次，疑似死循环？程序已经终止（栈溢出保护）';
    }
    const idx = gvm.tkidx-1;
    // const v = tobool(expr(4));
    // console.log(v);
    // if(v === false){
    //     while(next().val !== 'endwhile');
    //     console.log('endwhile!');
    //     gvm.loopcnt = 0;
    //     return true;
    // }else{
    while(gvm.tkidx < gvm.tokens.length && !gvm.stop){
        if(peek('until')){
            next();
            gvm.loopcnt++;
            const v = tobool(expr(4));
            if(v === false){
                gvm.tkidx=idx;
                return true;
            }else{
                gvm.loopcnt=0;
                return true;
            }
        }
        process();
    }
    throw '缺少`until`';
    // }
});

parser_table.set('while',function(){
    if(gvm.loopcnt>=500){
        gvm.loopcnt = 0;
        throw '循环次数超过500次，疑似死循环？程序已经终止（栈溢出保护）';
    }
    const idx = gvm.tkidx-1;
    const v = tobool(expr(4));
    console.log(v);
    if(v === false){
        while(next().val !== 'endwhile');
        console.log('endwhile!');
        gvm.loopcnt = 0;
        return true;
    }else{
        while(gvm.tkidx < gvm.tokens.length && !gvm.stop){
            if(peek('endwhile')){
                gvm.loopcnt++;
                gvm.tkidx = idx;
                return true;
            }
            process();
        }
        throw '缺少 `ENDWHILE`';
    }

});
parser_table.set('for',function(){
    if(!match('wd')){
        throw 'FOR循环需要一个计次变量 (例如 i<-1)';
    }
    const name = next().val;
    gvm.vars.set(name,gentoken('integer',0));
    gvm.tkidx--;
    
    expr(4);
    var i = gvm.vars.get(name);
    eat('to');
    const end = expr(4);
    if(!isnumeric(end)){
        throw 'TO 后面的值必须是一个number';
    }
    var step = 1;
    if(peek('step')){
        next();
        const s = expr(4);
        if(!isnumeric(s)){
            throw 'STEP 后面的值必须是一个number!';
        }
        step = s.val;
    }
    const pc = gvm.tkidx;
    console.log('initial:'+i.val+',to:'+end.val+',step:'+step);
    while(i.val <= end.val){
        while(gvm.tkidx < gvm.tokens.length && !gvm.stop){
            if(peek('endfor')){
                gvm.loopcnt++;
                gvm.tkidx = pc;
                break;
            }
            process();
        }
        i.val+=step;
        gvm.vars.set(name,i);
        console.log(i.val);
    }
    while(next().val !== 'endfor')
        ;
    return true;
});

parser_table.set('if',function(){
    const v = expr(4);
    eat('then')
    var s = tobool(v);
    while(gvm.tkidx < gvm.tokens.length && !gvm.stop){
        if(peek('endif')){
            break;
        }else if(peek('else')){
            next();
            s = !s;
            //非常巧妙的处理
            // :)
        }
        
        if(s){
            process();
        }else{
            next();
        }
    }
    
});

function endf(){
    const v = gvm.stacks.pop();
    gvm.vars = v.vars;
    gvm.tkidx = v.pc;

    throw 'endfunction';//发出中断
}

parser_table.set('return',function(){
    gvm.returnv = expr(4);
    endf();
});

parser_table.set('endfunction',function(){
    endf();
});

parser_table.set('endprocedure',function(){
    endf();
});

parser_table.set('input',function(){
    if(!match('wd')){
        throw 'INPUT后需要一个变量';
    }
    gvm.inputname = next().val;
    gvm.inputting = true;
    gvm.output('[等待输入中...]');
    // 'layui-btn layui-btn-disabled'
    document.getElementById('runbtn').setAttribute('class','layui-btn layui-btn-disabled');
    return true;
});


parser_table.set('output',function(){
    gvm.output(expr(4).val);
});

const nil_val={
    type:'nil',
    val:'nil'
};

function isnumeric(t){
    return t.type === 'integer' || t.type === 'real';
}

//
// 3: +/-/&(concat)
// 2: *//
// 1: < / > / <= / >=
// 0: AND OR
function get_prio(c){
    if(c==='^')
        return 4;
    else if(c==='+'||c==='-'||c==='&')
        return 3;
    else if(c==='*'||c==='/'||c==='%')
        return 2;
    else if(c==='and' || c==='or')
        return 1;
    else if(['<','>','='].includes(c))
        return 0;
}

function cmptype(v1,v2){
    const num = ['integer','real'];
    if(num.includes(v1.type) && num.includes(v2.type))
        return true;
    return v1.type === v2.type;
}

function fakeparm(){
    eat('(');
    const v = expr(4);
    eat(')');
    return v;
}

function fakecall(){
   eat('(');
   eat(')')
}

function expr(prio=3,assign = false){
    var sig = 0;
    const t = next();
    var leftv = nil_val;
    if(t.val === 'not'){
        leftv = expr(4);
        leftv = {type:'bool',val:!tobool(leftv)};
    }
    else if(t.val === '-' || t.val === '+'){
        leftv = expr(-1);
        if(leftv.type === 'integer' || leftv.type === 'real'){
            leftv.val = t.val==='-'? -leftv.val:leftv.val;
        }else{
            throw '无法将类型 `'+leftv.type+'` 转为 integer!';
        }
    }else if(t.val === '('){
        if(peek(')')){
            return nil_val;
        }
        leftv = expr(4);
        
        eat(')')
    }else if(t.val === 'asc'){
        const v = fakeparm();
        if(v.type !== 'string'){
            throw 'ASC函数必须作用于char类型上!';
        }
        leftv = {type:'integer',val:v.val.charCodeAt(0)};
    }else if(t.val === 'chr'){
        const v = fakeparm();
        if(v.type !== 'integer'){
            throw 'CHR函数必须作用于integer类型上!';
        }
        leftv = {type:'string',val:String.fromCharCode(v.val)};
    }else if(t.val === 'tonum'){
        const v = fakeparm();
        if(v.type !== 'string'){
            throw 'TONUM函数必须作用于string类型上!';
        }
        leftv = {type:'real',val:Number.parseFloat(v.val)};
    }else if(t.val === 'rnd'){
        fakecall();
        leftv = {type:'real',val:Math.random()};
    }
    else if(t.val === 'int'){
        const v = fakeparm();
        if(v.type !== 'real'){
            throw 'int函数必须作用于string类型上!';
        }
        leftv = {type:'integer',val:Math.floor(v.val)};
    }
    else if(t.type === 'wd'){
        const c = gvm.vars.get(t.val);
        if(c === undefined){
            throw '无法找到变量:`'+t.val+'`';
        }
        const cp = c.val;
        if(peek('[')){
            if(c.type === 'string'){
                next();
                const idx = expr(4);
                eat(']');
                if(idx.val < 0 || idx.val >= cp.length){
                    leftv = {type:'string',val:'undefined'};
                }else{
                    leftv = {type:'string',val:cp[idx.val]};
                }
            }
            else{
                if(c.type !== 'array'){
                    throw '变量 ' +t.val+' 不是一个数组!';
                }
                //数组索引
                next();
                var dimensions = [];
                while(true){
                    const tmp = expr(4);
                    if(!isnumeric(tmp)){
                        throw '数组索引必须是整数！';
                    }
                    dimensions.push(Math.floor(tmp.val));
                    if(!peek(',')){
                        break;
                    }
                    next();
                }
                eat(']');
                console.log(dimensions.length+","+cp.val.length);
                //维度检查
                if(dimensions.length !== cp.val.length){
                    throw '数组 维度不匹配';
                }
                var sig = '';
                dimensions.forEach((element,index) => {
                    if(cp.val[index].l > element || cp.val[index].r < element){
                        throw '数组访问越界！ '+element+' , ['+cp.val[index].l+','+cp.val[index].r+']';
                    }
                    sig+=element+',';
                });
                leftv = cp.ctx.get(sig);
                if(leftv === undefined){
                    leftv = {type:cp.type,val:'未定义的值'};
                }
                avisit = sig;
            }
        }else if(peek('(')){
            next();
            const parms = cp.parm;
            const old = gvm.vars;
            var closure = new Map();
            var cnt = 0;
            closure = structuredClone(old);
            for(let key of parms.keys()){
                const v = expr(4);
                closure.set(key,v);
                cnt++;
                if(!peek(',')){
                    break;
                }
                next();
            }
            if(cnt !== parms.size){
                throw '调用参数数量不匹配';
            }
            console.log(closure);
            eat(')','可能是参数不匹配？');
            // 加载闭包
            gvm.stacks.push({vars:old,pc:gvm.tkidx});
            gvm.vars = closure;
            gvm.tkidx = cp.pc;
            console.log(gvm);
            try{
                execute(undefined,gvm.output,true,false);
            }catch(e){
                if(e == 'endfunction'){
                    leftv = gvm.returnv;
                }else{
                    throw e;
                }
                console.log(e);
            }
        }else{
            leftv = {type:c.type,val:c.val};
        }
    }
    else if(t.type === 'number'){
        leftv = {type:'real',val:t.val};
    }else if(t.type === 'string'){
        leftv = t;
    }

    while(prio){
        if(!match('calc') && !peek('and') && !peek('or'))
            return leftv;
        const op = next();
        const p = get_prio(op.val);
        //判断优先级+递归下降
        //
        const opc = op.val;
        if(opc === '<' && peek('-') && prio === 4){
            // assign 
            eat('-');
            const rightv = expr(prio-1);
            if(t.type !== 'wd'){
                throw '赋值语句左侧必须是一个变量';
            }
            if(!cmptype(leftv,rightv)){
                throw '无法将类型 `'+rightv.type+'` 赋值给 `'+leftv.type+'`!';
            }
            if(sig !== 0){
                gvm.vars.get(t.val).val.ctx.set(sig,rightv);
            }else{
                gvm.vars.set(t.val,rightv);
            }
            return {type:'bool',val:true};
        }
        if(p<=prio){
            if(op.val === '<'){
                if(peek('=')){
                    next();
                    const rightv = expr(4);
                    if(isnumeric(leftv) && isnumeric(rightv)){
                        return {type:'bool',val:leftv.val <= rightv.val};
                    }else{
                        throw '比较运算必须在 两个 数值之间';
                    }
                }else if(peek('>')){
                    next();
                    const rightv = expr(4);
                    return {type:'bool',val:leftv.val !== rightv.val};
                }
                const rightv = expr(4);
                if(isnumeric(leftv) && isnumeric(rightv)){
                    return {type:'bool',val:leftv.val < rightv.val};
                }else{
                    throw '比较运算必须在 两个 数值之间';
                }
            }else if(op.val === '>'){
                if(peek('=')){
                    next();
                    const rightv = expr(4);
                    if(isnumeric(leftv) && isnumeric(rightv)){
                        return {type:'bool',val:leftv.val >= rightv.val};
                    }else{
                        throw '比较运算必须在 两个 数值之间';
                    }
                }
                const rightv = expr(4);
                if(isnumeric(leftv) && isnumeric(rightv)){
                    return {type:'bool',val:leftv.val > rightv.val};
                }else{
                    throw '比较运算必须在 两个 数值之间';
                }
            }else if(op.val === 'or'){
                const rightv = expr(4);
                return {type:'bool',val:tobool(leftv) || tobool(rightv)}
            }else if(op.val === 'and'){
                const rightv = expr(4);
                return {type:'bool',val:tobool(leftv) && tobool(rightv)}
            }
            

            if(op.val==='='){
                const rightv = expr(4);
                // compare
                return {type:'bool',val:leftv.val === rightv.val};
                // === 表示既判断类型又判断数值
            }
            const rightv = expr(p-1);
            if(isnumeric(leftv) && isnumeric(rightv)){
                if(opc === '+' || opc === '-'){
                    leftv.val = opc === '+'? leftv.val+rightv.val:leftv.val-rightv.val;
                }else if(opc === '*' || opc === '/'){
                    leftv.val = opc === '*'? leftv.val*rightv.val:leftv.val/rightv.val;
                }else if(opc === '^')
                    leftv.val = Math.pow(leftv.val,rightv.val);
                else if(opc === '%')
                    leftv.val = leftv.val%rightv.val;
                //return leftv;
            }else if(opc === '&' || opc === '+'){
                if(leftv.type === 'string'||leftv.type === 'integer' || leftv.type === 'real'){
                    leftv.val = leftv.val+rightv.val;
                }else{
                    throw '字符串拼接必须在两个string类型之间!';
                }
            }
            else{
                throw '比较运算必须在 两个 数值之间!'+leftv.type+' '+rightv.type;
            }
        }else{
            gvm.tkidx--;
            return leftv;
        }
        //if(p>=prio)

    }
    return leftv;
}

function process(){
    if(match('kwd')){
        const t = next();
        if(parser_table.has(t.val)){
            parser_table.get(t.val)();
            
        }
    }
    else if(match('newline')){
        next();
    }
    else{
        console.log(expr(4));
    }
}
// 编译器
function execute(tokens,lg,conti = false,eout = true){
    if(!conti){
        cleangvm(tokens);
        gvm.output = lg;
        gvm.vars.set('stdlib',{type:'string',val:codes_stdlib});
    }
    while(gvm.tkidx < gvm.tokens.length && !gvm.stop){
        if(gvm.inputting)
            return;
        try{
            process();
        }catch(e){
            if(eout){
                lg('运行时错误，在第'+gvm.tokens[gvm.tkidx-1].col+'行，原因：'+e);
                break;
            }else{
                throw e;
            }
        }
    }
    console.log(gvm);
}