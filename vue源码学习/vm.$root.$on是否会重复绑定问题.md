#vm.$root.$on是否会随着组件的销毁重建而重复绑定

> 问题描述：组件在跨组件通信是，使用到么vm.$on，将其绑定在root组件中，vm.$root.$on，但随着组件的销毁然后重建，在root组件上是否会绑定多个相同的event事件


```
Vue.prototype.$on = function (event, fn) {
    var this$1 = this;

    var vm = this;
    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$on(event[i], fn);
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm
  };
```
组件上的时间是一个_events数组，在进行绑定的时候，会进行判断是否存在，因此不会存在重复绑定问题。