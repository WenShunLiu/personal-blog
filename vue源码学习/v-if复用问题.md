# v-if 在何时会进行组件复用？为什么？

### 官网上的内容

>根据表达式的值的真假条件渲染元素。在切换时元素及它的数据绑定 / 组件被销毁并重建。如果元素是   template ，将提出它的内容作为条件块。当条件变化时该指令触发过渡效果。

单纯从官网上的定义来看，v-if控制着元素的是否被渲染和元素的销毁和重建，而v-show元素会一直存在，仅仅是控制着css的display属性来显示或者隐藏元素。

这样看来，在页面刚渲染时v-if性能会更好，但是频繁切换显示/隐藏，v-show性能更佳。

因此，v-if要提升切换是的开销，会复用相同的元素。v-if复用元素的问题，就成为了一个不小心就出现的一个无厘头bug。当然，你也可以在元素上加一个key，管理可复用元素，但这样子使得代码代码量变大，并且还要想出那么多key名字，无形之中增加了一定工作量。

### v-if 在何时会进行组件复用

在业务实践中得出的结论：

当前得出结论（未看源码）

挂在了v-if节点的直接子节点才会被复用，节点会被直接复用，会直接替换text节点、属性。

但是间接子节点，会将其销毁重建。

#### 源码分析

1、vue会先解析template模板或render函数，生成一个AST对象

```
ASTElement = {
  type: 1;
  tag: string;
  attrsList: Array<{ name: string; value: any }>;
  attrsMap: { [key: string]: any };
  parent: ASTElement | void;
  children: Array<ASTNode>;


  inlineTemplate?: true;
  ref?: string;
  ifProcessed?: boolean;  //防止递归
  elseif?: string;
  else?: true;
  if?: string;
  ifConditions?: ASTIfConditions;
  once?: true;
}
```

列举的都是部分属性，一下都是这样的

其中涉及到v-if的对象类型：ASTIfConditions （ASTIfCondition数组） 

```
  ASTIfConditions = Array<ASTIfCondition>;
```

  ASTIfCondition：存放着解析v-if所需要的数据
```
ASTIfCondition = {
  exp: ?string;     // v-if="exp"
  block: ASTElement;      // element 节点
}
```

文件路径：/vue/flow/compiler.js

2、从根节点解析所有tag，生成一个树结构，每个节点都为ASTElement类型的对象

解析v-if，v-else，v-else-if三者，组织成第一步所需的结构

```
function processIf (el) {
    const exp = getAndRemoveAttr(el, 'v-if') // v-if="exp"
    if (exp) {
        el.if = exp
       addIfCondition(el, {
            exp: exp,
            block: el
       })
    } else {
       if (getAndRemoveAttr(el, 'v-else') != null) {
           el.else = true
       }
       const elseif = getAndRemoveAttr(el, 'v-else-if')
       if (elseif) {
         el.elseif = elseif
       }
    }
}


function processIfConditions (el, parent) {
     const prev = findPrevElement(parent.children)
     if (prev && prev.if) {
         addIfCondition(prev, {
             exp: el.elseif,
            block: el
        })
     } else if (process.env.NODE_ENV !== 'production') {
         warn(
           `v-${el.elseif ? ('else-if="' + el.elseif + '"') : 'else'} ` +
           `used on element <${el.tag}> without corresponding v-if.`
        )
}
```

经过这两步的解析，会生成第一步中的 ASTIfCondition 对象。

例如： 
```
<div v-if="show">
  <span>666</span>
</div>
```

会解析为 

```
ASTIfCondition = {
  exp: 'show',
  el: '<div>
        <span>666</span>
      </div>'
}
```

文件路径： /vue/src/compiler/parser/index.js

3、解析第二步生成的树结构

与其说是树结构，其实就是一个从根节点向下的 ASTElement 对象。

```
export function generate (
  ast: ASTElement | void,
  options: CompilerOptions
): CodegenResult {
  const state = new CodegenState(options)

  // 如果ASTElement不为空 则调用genElement函数，否则直接开始渲染
  const code = ast ? genElement(ast, state) : '_c("div")'
  return {
        render: `with(this){return ${code}}`,
        staticRenderFns: state.staticRenderFns
    }
}
```
genElement

这里面判断其一些属性，同时避免递归

在处理v-if时会使用genIf函数进行处理。

```
export function genElement (el: ASTElement, state: CodegenState): string {
  if (el.staticRoot && !el.staticProcessed) {
    return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget) {
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    return genSlot(el, state)
  } else {
    // component or element
    let code
    if (el.component) {
      code = genComponent(el.component, el, state)
    } else {
      const data = el.plain ? undefined : genData(el, state)

      const children = el.inlineTemplate ? null : genChildren(el, state, true)
      code = `_c('${el.tag}'${
        data ? `,${data}` : '' // data
      }${
        children ? `,${children}` : '' // children
      })`
    }
    // module transforms
    for (let i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code)
    }
    return code
  }
}
```


genIf函数，避免递归，调用genIfConditions
```
export function genIf (
   el: any,
   state: CodegenState,
   altGen?: Function,
   altEmpty?: string
): string {
   el.ifProcessed = true // avoid recursion 避免递归
   return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}
// 解析v-if
```
genIfConditions函数，
解析AST对象中的ifConditions数组对象
```
function genIfConditions (
    conditions: ASTIfConditions,
    state: CodegenState,
    altGen?: Function,
    altEmpty?: string
): string {
    if (!conditions.length) {
      // 没有v-if就直接正常渲染
        return altEmpty || '_e()'
    }

    const condition = conditions.shift()
    if (condition.exp) {
        // condition.exp为true ，则执行genTernaryExp函数解析dom，否则解析下一个v-if
        return `(${condition.exp})?${
            genTernaryExp(condition.block)
            }:${
            genIfConditions(conditions, state, altGen, altEmpty)
           }`
        } else {
    return `${genTernaryExp(condition.block)}`
}
```

genTernaryExp函数
```
// v-if with v-once should generate code like (a)?_m(0):_m(1)
function genTernaryExp (el) {
    return altGen
          ? altGen(el, state)
          : el.once     // el.once  默认值为true  因此会执行到 genOnce；
         ? genOnce(el, state)
         : genElement(el, state)
    }
}
```

genOnce函数：

我们讨论的是直接子节点的复用问题，v-if是在根节点上，不存在parent，并且不再v-for中，也没有绑定key值，因此会执行到genStatic函数。

```
// v-once
function genOnce (el: ASTElement, state: CodegenState): string {
    el.onceProcessed = true
    if (el.if && !el.ifProcessed) {
        return genIf(el, state)
     } else if (el.staticInFor) {
    let key = ''
    let parent = el.parent
    while (parent) {
        if (parent.for) {
           key = parent.key
           break
          }
       parent = parent.parent
     }
   if (!key) {
        process.env.NODE_ENV !== 'production' && state.warn(
        `v-once can only be used inside v-for that is keyed. `
         )
        return genElement(el, state)
     }
    return `_o(${genElement(el, state)},${state.onceId++},${key})`
    } else {
        return genStatic(el, state)
   }
}
```

genStatic：
返回去执行genElement函数

```
function genStatic (el: ASTElement, state: CodegenState): string {
    el.staticProcessed = true
    state.staticRenderFns.push(`with(this){return ${genElement(el, state)}}`)

    return `_m(${              // _m()为渲染函数中的一种，很重要，具体见下半部分
    state.staticRenderFns.length - 1
    }${
    el.staticInFor ? ',true' : ''
    })`
}
```
回到genElement：
这里的递归已经避免了，if、for、static、once都已经被处理过了。
这里会对他的子节点进行处理，很关键

```
export function genElement (el: ASTElement, state: CodegenState): string {
  if (el.staticRoot && !el.staticProcessed) {
    return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget) {
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    return genSlot(el, state)
  } else {
    // component or element
    let code
    if (el.component) {
      code = genComponent(el.component, el, state)
    } else {
      // 取该element里的属性进行拼接
      const data = el.plain ? undefined : genData(el, state)

      // 这里处理子节点（关键）
      const children = el.inlineTemplate ? null : genChildren(el, state, true)

      code = `_c('${el.tag}'${
        data ? `,${data}` : '' // data
      }${
        children ? `,${children}` : '' // children
      })`
    }
    // module transforms
    for (let i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code)
    }
    return code
  }
}
```

genChildren：
这里递归处理子节点，解析完之后会进行HTML渲染。


```
export function genChildren (
  el: ASTElement,
  state: CodegenState,
  checkSkip?: boolean,
  altGenElement?: Function,
  altGenNode?: Function
): string | void {
    const children = el.children
    if (children.length) {
        const el: any = children[0]
        // optimize single v-for
        if (children.length === 1 &&
            el.for &&
            el.tag !== 'template'  &&
            el.tag !== 'slot'
          ) {
               return (altGenElement || genElement)(el, state)
            }
       const normalizationType = checkSkip
             ? getNormalizationType(children, state.maybeComponent)
            : 0
      const gen = altGenNode || genNode
      return `[${children.map(c => gen(c, state)).join(',')}]${
             normalizationType ? `,${normalizationType}` : ''
            }`
      }
}


function genNode (node: ASTNode, state: CodegenState): string {
  if (node.type === 1) {
  return genElement(node, state)
  } if (node.type === 3 && node.isComment) {
  return genComment(node)
  } else {
  return genText(node)
  }
}

```
文件路径： /vue/src/compiler/codegen/index.js


4.具体的html渲染

在所有的AST对象都被解析之后，会执行genStatic函数return出来的函数，其中主要看_m 渲染函数。

```
function installRenderHelpers (target) {
target._o = markOnce;
target._n = toNumber;
target._s = toString;
target._l = renderList;
target._t = renderSlot;
target._q = looseEqual;
target._i = looseIndexOf;
target._m = renderStatic;   // 关于v-if的具体渲染函数。
target._f = resolveFilter;
target._k = checkKeyCodes;
target._b = bindObjectProps;
target._v = createTextVNode;
target._e = createEmptyVNode;
target._u = resolveScopedSlots;
target._g = bindObjectListeners;
}

```

renderStatic：
函数定义：

```
function renderStatic (
    index,
    isInFor
) {
    var cached = this._staticTrees || (this._staticTrees = []);
    var tree = cached[index];
    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree by doing a shallow clone.

// 此处对vnode进行了一个clone，但未对节点的子元素进行clone，因此只有第一层子元素才会被复用。
    if (tree && !isInFor) {
        return Array.isArray(tree)
        ? cloneVNodes(tree)
        : cloneVNode(tree)
    }
// otherwise, render a fresh tree.
    tree = cached[index] = this.$options.staticRenderFns[index].call(
      this._renderProxy,
      null,
      this // for render fns generated for functional component templates
    );
    markStatic(tree, ("__static__" + index), false);
    return tree
}
```

我们可以看下cloneVNodes函数，

有个deep参数。

```
function cloneVNodes (vnodes, deep) {
    var len = vnodes.length;
    var res = new Array(len);
    for (var i = 0; i < len; i++) {
        res[i] = cloneVNode(vnodes[i], deep);
    }
    return res
}
```

我们继续看其调用的cloneVNode函数：

deep参数为true时，会对其子节点进行一个拷贝，但上面调用的时候deep参数为undefined，因此只会拷贝直接子节点。

```
// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
function cloneVNode (vnode, deep) {
    var componentOptions = vnode.componentOptions;
    var cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    componentOptions,
    vnode.asyncFactory
   );
     cloned.ns = vnode.ns;
     cloned.isStatic = vnode.isStatic;
     cloned.key = vnode.key;
     cloned.isComment = vnode.isComment;
     cloned.fnContext = vnode.fnContext;
     cloned.fnOptions = vnode.fnOptions;
     cloned.fnScopeId = vnode.fnScopeId;
     cloned.isCloned = true;
     if (deep) {
     if (vnode.children) {
         cloned.children = cloneVNodes(vnode.children, true);
       }
      if (componentOptions && componentOptions.children) {
           componentOptions.children = cloneVNodes(componentOptions.children, true);
      }
    }
    return cloned
}
```
```


// isCloned 为true，会把原先vnode中的componentInstance进行赋值，但其子节点的isCloned为false，会全部重新生成

// 同时，vnode和oldvnode必须全为静态节点并且key值相同

if (isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
    ) {
      vnode.componentInstance = oldVnode.componentInstance;
      return
}

```

总结：验证了文章开头的猜想，v-if只有直接子节点才会进行一个复用，其间接子节点都会销毁重建，因为在vue内部进行静态render的时候，本身就没有clone下间接子节点，只clone下了直接子节点，对属性进行了拼接。（所有的前提都是没有key值的情况下）

[vue issue](https://github.com/vuejs/vue/issues/4216)