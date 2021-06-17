// @codekit-prepend "/vendor/hammer-2.0.8.js";
var twist;
var cmdVel;
var publishImmidiately = true;
var robot_IP;
var manager;
var teleop;
var ros;

function moveAction(linear, angular) {
    if (linear !== undefined && angular !== undefined) {
        twist.linear.x = linear;
        twist.angular.z = angular;
    } else {
        twist.linear.x = 0;
        twist.angular.z = 0;
    }
    cmdVel.publish(twist);
}

function initVelocityPublisher() {
    // Init message with zero values.
    twist = new ROSLIB.Message({
        linear: {
            x: 0,
            y: 0,
            z: 0
        },
        angular: {
            x: 0,
            y: 0,
            z: 0
        }
    });
    // Init topic object
    cmdVel = new ROSLIB.Topic({
        ros: ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
    });
    // Register publisher within ROS system
    cmdVel.advertise();
}

function initTeleopKeyboard() {
    // Use w, s, a, d keys to drive your robot

    // Check if keyboard controller was aready created
    if (teleop == null) {
        // Initialize the teleop.
        teleop = new KEYBOARDTELEOP.Teleop({
            ros: ros,
            topic: '/cmd_vel'
        });
    }

    // Add event listener for slider moves
    robotSpeedRange = document.getElementById("robot-speed");
    robotSpeedRange.oninput = function() {
        teleop.scale = robotSpeedRange.value / 100
    }
}

function createJoystick() {
    // Check if joystick was aready created
    if (manager == null) {
        joystickContainer = document.getElementById('joystick');
        // joystck configuration, if you want to adjust joystick, refer to:
        // https://yoannmoinet.github.io/nipplejs/
        var options = {
            zone: joystickContainer,
            position: { left: 90 + '%', top: 300 + 'px' },
            mode: 'static',
            size: 200,
            color: 'rgb(238, 238, 238)',
            restJoystick: true
        };
        manager = nipplejs.create(options);
        // event listener for joystick move
        manager.on('move', function(evt, nipple) {
            // nipplejs returns direction is screen coordiantes
            // we need to rotate it, that dragging towards screen top will move robot forward
            var direction = nipple.angle.degree - 90;
            if (direction > 180) {
                direction = -(450 - nipple.angle.degree);
            }
            // convert angles to radians and scale linear and angular speed
            // adjust if youwant robot to drvie faster or slower
            var lin = Math.cos(direction / 57.29) * nipple.distance * 0.005;
            var ang = Math.sin(direction / 57.29) * nipple.distance * 0.05;
            // nipplejs is triggering events when joystic moves each pixel
            // we need delay between consecutive messege publications to 
            // prevent system from being flooded by messages
            // events triggered earlier than 50ms after last publication will be dropped 
            if (publishImmidiately) {
                publishImmidiately = false;
                moveAction(lin, ang);
                setTimeout(function() {
                    publishImmidiately = true;
                }, 50);
            }
        });
        // event litener for joystick release, always send stop message
        manager.on('end', function() {
            moveAction(0, 0);
        });
    }
}


window.onload = function() {
    // determine robot address automatically
    // robot_IP = location.hostname;
    // set robot address statically
    robot_IP = "192.168.43.10";

    // // Init handle for rosbridge_websocket
    ros = new ROSLIB.Ros({
        url: "ws://0.tcp.ngrok.io:19851"
    });

    initVelocityPublisher();
    // get handle for video placeholder

    // Populate video source 


    // joystick and keyboard controls will be available only when video is correctly loaded
    createJoystick();
    console.log("are u working??");
    initTeleopKeyboard();

}

$(document).ready(function() {

    // DOMMouseScroll included for firefox support
    var canScroll = true,
        scrollController = null;
    $(this).on('mousewheel DOMMouseScroll', function(e) {

        if (!($('.outer-nav').hasClass('is-vis'))) {

            e.preventDefault();

            var delta = (e.originalEvent.wheelDelta) ? -e.originalEvent.wheelDelta : e.originalEvent.detail * 20;

            if (delta > 50 && canScroll) {
                canScroll = false;
                clearTimeout(scrollController);
                scrollController = setTimeout(function() {
                    canScroll = true;
                }, 800);
                updateHelper(1);
            } else if (delta < -50 && canScroll) {
                canScroll = false;
                clearTimeout(scrollController);
                scrollController = setTimeout(function() {
                    canScroll = true;
                }, 800);
                updateHelper(-1);
            }

        }

    });

    $('.side-nav li, .outer-nav li').click(function() {

        if (!($(this).hasClass('is-active'))) {

            var $this = $(this),
                curActive = $this.parent().find('.is-active'),
                curPos = $this.parent().children().index(curActive),
                nextPos = $this.parent().children().index($this),
                lastItem = $(this).parent().children().length - 1;

            updateNavs(nextPos);
            updateContent(curPos, nextPos, lastItem);

        }

    });

    $('.cta').click(function() {

        var curActive = $('.side-nav').find('.is-active'),
            curPos = $('.side-nav').children().index(curActive),
            lastItem = $('.side-nav').children().length - 1,
            nextPos = lastItem;

        updateNavs(lastItem);
        updateContent(curPos, nextPos, lastItem);

    });

    // swipe support for touch devices
    var targetElement = document.getElementById('viewport'),
        mc = new Hammer(targetElement);
    mc.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
    mc.on('swipeup swipedown', function(e) {

        updateHelper(e);

    });

    $(document).keyup(function(e) {

        if (!($('.outer-nav').hasClass('is-vis'))) {
            e.preventDefault();
            updateHelper(e);
        }

    });

    // determine scroll, swipe, and arrow key direction
    function updateHelper(param) {

        var curActive = $('.side-nav').find('.is-active'),
            curPos = $('.side-nav').children().index(curActive),
            lastItem = $('.side-nav').children().length - 1,
            nextPos = 0;

        if (param.type === "swipeup" || param.keyCode === 40 || param > 0) {
            if (curPos !== lastItem) {
                nextPos = curPos + 1;
                updateNavs(nextPos);
                updateContent(curPos, nextPos, lastItem);
            } else {
                updateNavs(nextPos);
                updateContent(curPos, nextPos, lastItem);
            }
        } else if (param.type === "swipedown" || param.keyCode === 38 || param < 0) {
            if (curPos !== 0) {
                nextPos = curPos - 1;
                updateNavs(nextPos);
                updateContent(curPos, nextPos, lastItem);
            } else {
                nextPos = lastItem;
                updateNavs(nextPos);
                updateContent(curPos, nextPos, lastItem);
            }
        }

    }

    // sync side and outer navigations
    function updateNavs(nextPos) {

        $('.side-nav, .outer-nav').children().removeClass('is-active');
        $('.side-nav').children().eq(nextPos).addClass('is-active');
        $('.outer-nav').children().eq(nextPos).addClass('is-active');

    }

    // update main content area
    function updateContent(curPos, nextPos, lastItem) {

        $('.main-content').children().removeClass('section--is-active');
        $('.main-content').children().eq(nextPos).addClass('section--is-active');
        $('.main-content .section').children().removeClass('section--next section--prev');

        if (curPos === lastItem && nextPos === 0 || curPos === 0 && nextPos === lastItem) {
            $('.main-content .section').children().removeClass('section--next section--prev');
        } else if (curPos < nextPos) {
            $('.main-content').children().eq(curPos).children().addClass('section--next');
        } else {
            $('.main-content').children().eq(curPos).children().addClass('section--prev');
        }

        if (nextPos !== 0 && nextPos !== lastItem) {
            $('.header--cta').addClass('is-active');
        } else {
            $('.header--cta').removeClass('is-active');
        }

    }

    function outerNav() {

        $('.header--nav-toggle').click(function() {

            $('.perspective').addClass('perspective--modalview');
            setTimeout(function() {
                $('.perspective').addClass('effect-rotate-left--animate');
            }, 25);
            $('.outer-nav, .outer-nav li, .outer-nav--return').addClass('is-vis');

        });

        $('.outer-nav--return, .outer-nav li').click(function() {

            $('.perspective').removeClass('effect-rotate-left--animate');
            setTimeout(function() {
                $('.perspective').removeClass('perspective--modalview');
            }, 400);
            $('.outer-nav, .outer-nav li, .outer-nav--return').removeClass('is-vis');

        });

    }

    function workSlider() {

        $('.slider--prev, .slider--next').click(function() {

            var $this = $(this),
                curLeft = $('.slider').find('.slider--item-left'),
                curLeftPos = $('.slider').children().index(curLeft),
                curCenter = $('.slider').find('.slider--item-center'),
                curCenterPos = $('.slider').children().index(curCenter),
                curRight = $('.slider').find('.slider--item-right'),
                curRightPos = $('.slider').children().index(curRight),
                totalWorks = $('.slider').children().length,
                $left = $('.slider--item-left'),
                $center = $('.slider--item-center'),
                $right = $('.slider--item-right'),
                $item = $('.slider--item');

            $('.slider').animate({ opacity: 0 }, 400);

            setTimeout(function() {

                if ($this.hasClass('slider--next')) {
                    if (curLeftPos < totalWorks - 1 && curCenterPos < totalWorks - 1 && curRightPos < totalWorks - 1) {
                        $left.removeClass('slider--item-left').next().addClass('slider--item-left');
                        $center.removeClass('slider--item-center').next().addClass('slider--item-center');
                        $right.removeClass('slider--item-right').next().addClass('slider--item-right');
                    } else {
                        if (curLeftPos === totalWorks - 1) {
                            $item.removeClass('slider--item-left').first().addClass('slider--item-left');
                            $center.removeClass('slider--item-center').next().addClass('slider--item-center');
                            $right.removeClass('slider--item-right').next().addClass('slider--item-right');
                        } else if (curCenterPos === totalWorks - 1) {
                            $left.removeClass('slider--item-left').next().addClass('slider--item-left');
                            $item.removeClass('slider--item-center').first().addClass('slider--item-center');
                            $right.removeClass('slider--item-right').next().addClass('slider--item-right');
                        } else {
                            $left.removeClass('slider--item-left').next().addClass('slider--item-left');
                            $center.removeClass('slider--item-center').next().addClass('slider--item-center');
                            $item.removeClass('slider--item-right').first().addClass('slider--item-right');
                        }
                    }
                } else {
                    if (curLeftPos !== 0 && curCenterPos !== 0 && curRightPos !== 0) {
                        $left.removeClass('slider--item-left').prev().addClass('slider--item-left');
                        $center.removeClass('slider--item-center').prev().addClass('slider--item-center');
                        $right.removeClass('slider--item-right').prev().addClass('slider--item-right');
                    } else {
                        if (curLeftPos === 0) {
                            $item.removeClass('slider--item-left').last().addClass('slider--item-left');
                            $center.removeClass('slider--item-center').prev().addClass('slider--item-center');
                            $right.removeClass('slider--item-right').prev().addClass('slider--item-right');
                        } else if (curCenterPos === 0) {
                            $left.removeClass('slider--item-left').prev().addClass('slider--item-left');
                            $item.removeClass('slider--item-center').last().addClass('slider--item-center');
                            $right.removeClass('slider--item-right').prev().addClass('slider--item-right');
                        } else {
                            $left.removeClass('slider--item-left').prev().addClass('slider--item-left');
                            $center.removeClass('slider--item-center').prev().addClass('slider--item-center');
                            $item.removeClass('slider--item-right').last().addClass('slider--item-right');
                        }
                    }
                }

            }, 400);

            $('.slider').animate({ opacity: 1 }, 400);

        });

    }

    function transitionLabels() {

        $('.work-request--information input').focusout(function() {

            var textVal = $(this).val();

            if (textVal === "") {
                $(this).removeClass('has-value');
            } else {
                $(this).addClass('has-value');
            }

            // correct mobile device window position
            window.scrollTo(0, 0);

        });

    }

    outerNav();
    workSlider();
    transitionLabels();

});