function Man() {
  this.init(def = 2, atk = 3, hp = 3)
}
Man.prototype.init = function(def, atk, hp) {
  this.def = def
  this.atk = atk
  this.hp = hp
}
Man.prototype.toString = function() {
  return `防御力:${this.def},攻击力:${this.atk},血量:${this.hp}`;
}

// 装饰器对象
function Decorete(man) {
  this.man = man
} 

// 重新定义父类方法
Decorete.prototype.toString = function() {
  return this.man.toString()
}

// 创建具体的装饰器，集成装饰器对象
function decoratorIcroMan(man) {

  // 对传入的对象进行处理
  const moreDef = 100
  man.def += moreDef
  Decorete.call(this, man)
}

decoratorIcroMan.prototype = Object.create(Decorete.prototype)

decoratorIcroMan.prototype.toString = function() {
  return this.man.toString()
}

let tony = new Man()

tony = new decoratorIcroMan(tony)


console.log(`${tony}`)
console.log(tony)