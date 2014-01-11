(function(global, undef) {
	$(function() {

		function objtoarr(obj) {
			var ret = [];
			for (var i in obj) {
				ret.push(obj[i]);
			}
			return ret;
		}

		window.snake = new Snake;

		snake.config({
			containerId: 'hehe'
		});

		var serverid;
        var gamestatus;
        snake.loadAllFood();
		snake.init();

		var socket = io.connect('http://172.16.121.168:5566');
		//初始化房间信息- 剔除server id
		socket.on('open', function(data) {
			//console.log(data.roomstatus);
			//console.log(data.id + ' is in the room');
			serverid = data.id;
			socket.emit('serverinit', serverid);
			socket.emit('reopen');
			$('#number').text('当前房间人数0');
            updateReady(data.roomstatus);
		});

        function updateReady(roomstatus){
			var ret = '';
			for (var i in roomstatus) {
				ret += roomstatus[i].name + ':' + (roomstatus[i].isready ? '已准备': '未准备') + '<br>';
			}
			$('#userstatus').html(ret);
        }

		snake.bind('died', 'room',function(data) {
           socket.emit('died',data.name);  
        });
        
        var unit = snake.config().unitLength + 'px';
        function showRank(){
            var ret ='';
            console.log(snake.playerScores);
            for(var i in snake.playerScores){
                var score = snake.playerScores[i];
                
                ret += i +'：'+score+'<br>';
            }  
            $('#currentrank').html(ret);
        }

        function showTips() {
            var ret = [];
            for(var i in snake.__foodPlugins) {
                var item = snake.__foodPlugins[i];
                ret.push('<span class="' , item.cssName , '" style="display:inline-block;height:', unit ,'; width : ', unit ,'"></span>'
                     ,'<span style="display:inline-block">',item.info,'</span><br/>')
            }
            $('#pluginInfo').html(ret.join(''));
        }

        snake.bind('eat','room',function(){
           showRank();  

        });

        snake.bind('starting','room',function(){//加状态显示
                var ret = '';
                for(var i in snake.players) {
                    ret += '<p class='+snake.players[i].snake.cssName+'">'+i+':</p>';
                    if(snake.players[i].buff) {
                        for(var ef in snake.players[i].buff) {
                            var buff = snake.players[i].buff[ef];
                            if(buff.fp >0 && typeof buff.unEffect == 'function') {
                                ret+= ('<span class="' + snake.__hasPlugin[ef].cssName + '" style="display:inline-block;height:'+ unit +'; width : '+ unit +'"></span>' +  buff.fp);
                            }
                        } 
                    }
                }
                $('#buffstatus').html(ret);
        })

        snake.bind('gameover','room',function(data){
           socket.emit('gameover');  
           alert('game over!')

           //setTimeout(function(){
             location.reload();
           //},3000);
        });

		socket.on('system', function(json) {
            if(json.type == 'updateReady'){
                updateReady(json.data);     
            }
			if (json.type == 'new') {
				socket.emit('status', function(data) {
					var users = [];
					for (var i in data) {
						var user = data[i];
						users.push({
							name: user.id,
                            cssName : 'user'
						});
					}
					snake.addPlayers(users);
				});
				$('#number').text('当前房间人数' + objtoarr(json.data).length);
                updateReady(json.data);
			}
			if (json.type === 'allready') {
				var s = 5;
				$('#status').text('还有' + s + '秒,游戏即将开始');
				var T = setInterval(function() {
					s--;
					$('#status').text('还有' + s + '秒,游戏即将开始');
					if (s === 0) {
						clearInterval(T);
						snake.run();
                        //显示分数
                        showRank();
                        showTips();
                        gamestatus = true;
					}
				},
				1000);
			}
			if (json.type === 'disconnect') {
				//判断全离线 初始化
				//alert('id ' + json.data.roomstatus[json.data.id] + ' is out');
                snake.removePlayer(json.data.id);
				$('#number').text('当前房间人数' + objtoarr(json.data.roomstatus).length);
				//如果一个用户掉了，要remove掉蛇实例
			}
			if (json.type == 'top') {
				snake.setDirection(snake.players[json.data.id].snake, 'up');
			}
			if (json.type == 'right') {
				snake.setDirection(snake.players[json.data.id].snake, 'right');
			}
			if (json.type == 'down') {
				snake.setDirection(snake.players[json.data.id].snake, 'down');
			}
			if (json.type == 'left') {
				snake.setDirection(snake.players[json.data.id].snake, 'left');
			}
		});
	});
})(this);

