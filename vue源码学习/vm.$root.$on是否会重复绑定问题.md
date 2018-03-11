#vm.$root.$on是否会随着组件的销毁重建而重复绑定

> 问题描述：组件在跨组件通信是，使用到么vm.$on，将其绑定在root组件中，vm.$root.$on，但随着组件的销毁然后重建，在root组件上是否会绑定多个相同的event事件

      (vm._events[event] || (vm._events[event] = [])).push(fn);