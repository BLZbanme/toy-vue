# 手写vue

![1596692677398](.\vue.png)

## 1.数据代理

实现vm.data直接访问到vm.$data

```javascript
class Vue {

    constructor(options) {
        this.$el = options.$el;
        this.$data = options.data;
        this.$options = options;

        this.proxyData(this.$data);
    }

    //可以通过this.xx更改 this.$data.xx的结果
    proxyData(data) {
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                get() {
                    return data[key];
                },
                set(newVal) {
                    data[key] = newVal;
                }
            })
        })
    }

}
```

## 2.响应式

在vue的构造函数中，new一个Observer对象

```javascript
class Vue {

    constructor(options) {
        this.$el = options.$el;
        this.$data = options.data;
        this.$options = options;

        //触发 this.$data.xx 和模板的绑定
        new Observer(this.$data);
        this.proxyData(this.$data);
    }
}
```

```javascript
class Observer {
    constructor(data) {
        this.observe(data);
    }

    observe(data) {
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key]);
            })
        }
    }

    defineReactive(obj, key, value) {
        this.observe(value);
        Object.defineProperty(obj, key, {
            get() {
                console.log('$data get', key, value);
                return value;
            },
            set: (newVal) => {
                if (value === newVal) {
                    return;
                }
                console.log('$data set', key, newVal);
                this.observe(newVal);
                value = newVal;
            }
        })
    }
}
```

## 3.模板编译

对于element和text各自处理，"v-"和"{{  }}"

```javascript
class Compiler {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;

        const fragment = this.compileFragment(this.el);

        this.compile(fragment);
        this.el.appendChild(fragment);
    }

    compile(fragment) {
        const childNodes = Array.from(fragment.childNodes);
        childNodes.forEach(childNode => {
            if (this.isElementNode(childNode)) {
                //标签结点h1 / input 读取属性，查看是否有v-开头的内容
                
                this.compileElement(childNode);
            }
            else if (this.isTextNode(childNode)) {
                this.compileText(childNode);
            }

            if (childNode.childNodes && childNode.childNodes.length) {
                this.compile(childNode);
            }
        })
    }

    compileElement(node) {
        // v-model v-text v-on:click
        const attributes = Array.from(node.attributes);
        attributes.forEach(attr => {
            const { name, value } = attr;
            console.log('attr', name, value);
            if (this.isDirector(name)) {
                //指令 v-model v-text v-bind
                const [, directive] = name.split('-');
                const [compileKey, eventName] = directive.split(':');
                utils[compileKey](node, value, this.vm, eventName);
            }
        })
    }

    isDirector(name) {
        return name.startsWith('v-');
    }

    compileText(node) {
        const content = node.textContent;
        if (/\{\{.+\}\}/.test(content)) {
            utils['text'](node, content, this.vm);
        }
    }

    compileFragment(el) {
        const f= document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild);
        }
        
        return f;
    }

    isElementNode(el) {
        return el.nodeType === 1;
    }

    isTextNode(el) {
        return el.nodeType === 3;
    }
}
```

## 4.依赖收集

Dep构造函数，主要作用是收集Watcher,就是在模板编译，get的时候收集依赖，set的时候notify所有依赖。

watcher的注册依赖的时候，最重要的就是```this.getOldValue();```，来把当前收集依赖的对象注册在一个全局变量中。

```javascript
class Dep {
    constructor() {
        this.collect = [];
    }

    addWatcher(watcher) {
        this.collect.push(watcher);
    }

    notify() {
        this.collect.forEach(w => w.update());
    }
}

class Watcher {
    constructor(expr, vm, cb) {
        this.expr = expr;
        this.vm = vm;
        this.cb = cb;
        // 通过getter的形式对数据进行绑定，标记当前的watcher
        this.oldValue = this.getOldValue();
    }

    getOldValue() {
        Dep.target = this;
        const oldValue = utils.getValue(this.expr, this.vm);
        Dep.target = null;
        return oldValue;
    }

    update() {
        const newValue = utils.getValue(this.expr, this.vm);
        if (newValue !== this.oldValue) {
            this.cb(newValue);
        }
    }
}
```

