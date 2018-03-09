'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dec, _class, _desc, _value, _class2;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

// 纯粹的装饰模式 ，防御增加100
function decorateArmour(target, key, descriptor) {
  // method为init函数
  console.log(key);
  console.log(descriptor);
  var method = descriptor.value;
  var moreDef = 100;
  var ret = void 0;
  // 重新执行init函数 
  descriptor.value = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    args[0] += moreDef;
    ret = method.apply(target, args);
    return ret;
  };
  // 返回一个新的函数
  return descriptor;
}

// 纯粹的装饰模式，攻击增加50
function decorateLight(target, key, descriptor) {
  var method = descriptor.value;
  var moreAtk = 50;
  var ret = void 0;
  descriptor.value = function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    args[1] += moreAtk;
    ret = method.apply(target, args);
    return ret;
  };
  return descriptor;
}
// 半透明的装饰模式, 作用在类上
function skill(skill) {
  if ((typeof skill === 'undefined' ? 'undefined' : _typeof(skill)) !== 'object') {
    throw Error('skill must be a object');
  }
  if (!skill.option) {
    throw Error('option in skill cant be undefine');
  }
  if (!skill.skill) {
    throw Error('skill in skill cant be undefine');
  }
  return function (target) {
    if (skill.option === 'add') {
      target['can' + skill.skill] = true;
    }
    var method = target.prototype.toString;
    var extry = '(\u589E\u52A0\u6280\u80FD: ' + skill.skill + ')';
    // 重新定义toSting函数
    target.prototype.toString = function () {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return method.apply(target.prototype, args) + extry;
    };
    // 返回一个新的类
    return target;
  };
}

var Man = (_dec = skill({
  option: 'add',
  skill: 'fly'
}), _dec(_class = (_class2 = function () {
  function Man() {
    var def = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
    var atk = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;
    var hp = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3;

    _classCallCheck(this, Man);

    this.init(def, atk, hp);
  }

  _createClass(Man, [{
    key: 'init',
    value: function init(def, atk, hp) {
      this.def = def, this.atk = atk, this.hp = hp;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return '\u9632\u5FA1\u529B:' + this.def + ',\u653B\u51FB\u529B:' + this.atk + ',\u8840\u91CF:' + this.hp;
    }
  }]);

  return Man;
}(), (_applyDecoratedDescriptor(_class2.prototype, 'init', [decorateArmour, decorateLight], Object.getOwnPropertyDescriptor(_class2.prototype, 'init'), _class2.prototype)), _class2)) || _class);


var tony = new Man();

console.log(tony);
console.log('' + tony);
