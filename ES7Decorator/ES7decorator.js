// 纯粹的装饰模式 ，防御增加100
function decorateArmour (target, key, descriptor) {
  // method为init函数
  const method = descriptor.value
  let moreDef = 100
  let ret
  // 重新执行init函数 
  descriptor.value = (...args)=>{
    args[0] += moreDef;
    ret = method.apply(target, args)
    return ret
  }
  // 返回一个新的函数
  return descriptor
}

// 纯粹的装饰模式，攻击增加50
function decorateLight(target, key, descriptor) {
  const method = descriptor.value
  let moreAtk = 50
  let ret
  descriptor.value = (...args)=>{
    args[1] += moreAtk
    ret = method.apply(target, args)
    return ret
  }
  return descriptor
}
// 半透明的装饰模式, 作用在类上
function skill (skill) {
  if (typeof skill !== 'object') {
    throw Error('skill must be a object')
  }
  if (!skill.option) {
    throw Error('option in skill cant be undefine')
  }
  if (!skill.skill) {
    throw Error('skill in skill cant be undefine')
  }
  return function(target) {
    if (skill.option === 'add') {
      target[`can${skill.skill}`] = true
    }
    let method = target.prototype.toString
    let extry = `(增加技能: ${skill.skill})`
    // 重新定义toSting函数
    target.prototype.toString = (...args) => {
      return method.apply(target.prototype, args) + extry
    }
    // 返回一个新的类
    return target
  }
}

@skill({
  option: 'add',
  skill: 'fly'
})
class Man {
  constructor(def = 2, atk = 3, hp = 3) {
    this.init(def, atk, hp)
  }
  
  @decorateArmour
  @decorateLight
  init(def, atk, hp) {
    this.def = def,
    this.atk = atk,
    this.hp = hp
  }
  toString(){
    return `防御力:${this.def},攻击力:${this.atk},血量:${this.hp}`;
  }
}

const tony = new Man()

console.log(tony)
console.log(`${tony}`)

