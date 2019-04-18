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
        // 主角跳跃高度
        jumpHeight: 0,
        // 主角跳跃持续时间
        jumpDuration: 0,
        // 最大移动速度
        maxMoveSpeed: 0,
        // 加速度
        accel: 0,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        cc.log("player start");
    },

    wxTouchFun:function(){
        if(cc.sys.isMobile){//是不是手机
            wx.vibrateShort();

        } 
        
    },
      
    // update (dt) {},
    setJumpAction: function () {
        // 跳跃上升
        var jumpUp = cc.moveBy(this.jumpDuration, cc.v2(0, this.jumpHeight)).easing(cc.easeCubicActionOut());
        // 下落
        var jumpDown = cc.moveBy(this.jumpDuration, cc.v2(0, -this.jumpHeight)).easing(cc.easeCubicActionIn());
        // 不断重复
        
        var fun = cc.callFunc(this.wxTouchFun,this);
        return cc.repeatForever(cc.sequence(jumpUp, jumpDown,fun));
    },
    onLeftButton(evnet){
        console.log("left",evnet)
        this.direction = -2//方向
        if  (this.direction > 0){
            this.xSpeed = 0;
        }
    },
    onRightButton: function(evnet){
        console.log("right",evnet)
        this.direction = 2//方向
        if  (this.direction < 0){
            this.xSpeed = 0;
        }
        
    },
    onKeyDown (event) {
        // set a flag when key pressed
        switch(event.keyCode) {
            case cc.KEY.a:
                this.accLeft = true;
                // cc.log("a1");
                break;
            case cc.KEY.d:
                this.accRight = true;
                // console.log("d1");
                break;
        }
    },

    onKeyUp (event) {
        // unset a flag when key released
        switch(event.keyCode) {
            case cc.KEY.a:
                this.accLeft = false;
                // console.log("a2");
                break;
            case cc.KEY.d:
                this.accRight = false;
                // cc.log("d2");
                break;
        }
    },
    onLoad: function () {
        // 初始化跳跃动作
        this.jumpAction = this.setJumpAction();
        this.node.runAction(this.jumpAction);

        // 加速度方向开关
        this.accLeft = false;
        this.accRight = false;
        // 主角当前水平方向速度
        this.xSpeed = 0;
        this.direction = 0//方向
        // 初始化键盘输入监听
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);   
        console.log("player onload");
    },

    onDestroy () {
        // 取消键盘输入监听
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },
    update: function (dt) {
        // 根据当前加速度方向每帧更新速度
        if (this.accLeft) {
            this.xSpeed -= this.accel * dt;
        } else if (this.accRight) {
            this.xSpeed += this.accel * dt;
        }
        if ( this.direction < 0) {
            this.xSpeed -= this.accel * dt
            this.direction ++

        } else if (this.direction > 0) {
            this.xSpeed += this.accel * dt
            this.direction --
        }

        // 限制主角的速度不能超过最大值
        if ( Math.abs(this.xSpeed) > this.maxMoveSpeed ) {
            // if speed reach limit, use max speed with current direction
            this.xSpeed = this.maxMoveSpeed * this.xSpeed / Math.abs(this.xSpeed);
        }
  
        if (this.node.x > 0 && this.node.x < 960){
            // 根据当前速度更新主角的位置
            
        }else{

        }

        this.node.x +=this.xSpeed * dt;
        
    },
});
