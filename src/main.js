import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import vuetify from "./plugins/vuetify";

import globalMixin from "./mixins/global.js";

Vue.config.productionTip = false;
Vue.mixin(globalMixin);

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
