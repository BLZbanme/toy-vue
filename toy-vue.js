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


class Vue {

    constructor(options) {
        this.$el = options.$el;
        this.$data = options.data;
        this.$options = options;

        //触发 this.$data.xx 和模板的绑定
        new Observer(this.$data);
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