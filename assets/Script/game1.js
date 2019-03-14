// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        // 这个属性引用了星星预制资源
        starPrefab: {
            default: null,
            type: cc.Prefab
        },
        // 星星产生后消失时间的随机范围
        maxStarDuration: 0,
        minStarDuration: 0,
        // 地面节点，用于确定星星生成的高度
        ground: {
            default: null,
            type: cc.Node
        },
        // player 节点，用于获取主角弹跳的高度，和控制主角行动开关
        players: {
            default: null,
            type: cc.Node
        },
        // score label 的引用
        scoreDisplay: {
            default: null,
            type: cc.Label
        },
        timeDisplay: {
            default: null,
            type: cc.Label
        }
    },

    onLoad: function () {
        
        // 初始化计时器
        this.timer = 0;
        this.starDuration = 0;

        // 获取地平面的 y 轴坐标
        this.groundY = this.ground.y + this.ground.height/2;
        // 生成一个新的星星
        this.spawnNewStar();
        // 初始化计分
        this.score = 0
        //////////////////////////////////////////////
        var v = cc.v2(20, 10);
        var endv = v.sub(cc.v2(6, 3));      // 向量减法
        console.log(endv)
        var v1 
        var endv2 = v.sub(cc.v2(5, 5), v1);  //v1无效，只有第一个参数有效
        console.log(endv2)
        console.log(cc.js.formatStr("a: %s, b: %s", 11, 22))
        
    },
    gainScore: function () {
        this.score += 1;
        // 更新 scoreDisplay Label 的文字
        this.scoreDisplay.string = 'Score: ' + this.score;
    },
    spawnNewStar: function() {
        // 使用给定的模板在场景中生成一个新节点
        var newStar = cc.instantiate(this.starPrefab);
        // 将新增的节点添加到 Canvas 节点下面
        this.node.addChild(newStar);
        console.log(this.node)
        newStar.setSiblingIndex(2)//设置同级索引，层级会有变化
        // 为星星设置一个随机位置
        newStar.setPosition(this.getNewStarPosition());

        newStar.getComponent('star').game = this;

        // 重置计时器，根据消失时间范围随机取一个值
        this.starDuration = this.minStarDuration + Math.random() * (this.maxStarDuration - this.minStarDuration);
        this.timer = 0;
    },

    getNewStarPosition: function () {
        var randX = 0;
        // 根据地平面位置和主角跳跃高度，随机得到一个星星的 y 坐标
        var randY = this.groundY + Math.random() * this.players.getComponent('player').jumpHeight + 50;
        // 根据屏幕宽度，随机得到一个星星 x 坐标
        var maxX = this.node.width/2;
        randX = (Math.random() - 0.5) * 2 * maxX;
        // 返回星星坐标
        return cc.v2(randX, randY);
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        cc.log("game1 start");
    },

    update: function (dt) {
        // 每帧更新计时器，超过限度还没有生成新的星星
        // 就会调用游戏失败逻辑
        if (this.timer * 0.01 > this.starDuration) {
            this.gameOver();
            return;
        }
        this.timer += 1;
        // console.log(this.timer,this.timer/100)
        this.timeDisplay.string =this.timer /100 //使用*0.01会出现精度问题
        
    },

    gameOver: function () {
        this.players.stopAllActions(); //停止 player 节点的跳跃动作
        cc.director.loadScene('gameOver');
    },
  
    ff:function (num,n){
        return parseInt(num*Math.pow(10,n)+0.5,10)/Math.pow(10,n);
    }
});
