var MyLib = window.MyLib = MyLib || {};
(function(){
  var YYSJC = MyLib.YYSJC = function (pointDatas) {
    if (!pointDatas) return
    this._pointDatas = pointDatas
    this._map = null
    this.init()
  }
  MyLib.YYSJC.prototype = {
      constructor: MyLib.YYSJC
    , _params: null // 数据
    , _prepoint: null // 管水厂水 父级
    , _curMenuId: 'menu1' // 当前菜单号
    , _curChartData: null // 地图点 eChart 数据
    , _pointFilterData: null // 过滤数据


    , _map: null // 地图
    , _heatmapOverlay: null // 热点图
    , _iconInfo: null // 地图点提示信息
    , _infoWin: null // 地图点窗口
    , _ply: null // 供水范围绘制区域
    , _myDis: null // 测距
    , _toolFilter: null // 工具条 过滤
    , _toolMenu: null // 工具条 菜单
    , _toolEquivalentIcon: null // 工具条 热力图示例
    , _toolTimeBar: null // 工具条 时间条

    , _interval: null // 时间句柄
    , _intervalTime: 3000 // 时间间隔
    , _curPointer: 1 // 当前指针
    , _maxPointer: 12 // 最大指针

    , init: function(){
        this._map = new BMap.Map("allmap",  {minZoom:10, maxZoom:14});
        this._myDis = new BMapLib.DistanceTool(this._map);
        this._map.centerAndZoom("上海", 12);
        this._map.enableScrollWheelZoom(true);

        this._map.addEventListener("zoomend", $.proxy(this.onZoomend, this));


        // 添加工具条
        this._toolFilter = new BMapLib.ToolFilter();
        this._toolFilter.addEventListener("onfilter", $.proxy(this.onFilter, this));
        this._map.addControl(this._toolFilter);

        this._toolMenu = new BMapLib.ToolMenu();
        this._toolMenu.addEventListener("onmenu", $.proxy(this.onMenu, this));
        this._map.addControl(this._toolMenu);

        this._toolEquivalentIcon = new BMapLib.ToolEquivalentIcon();
        this._map.addControl(this._toolEquivalentIcon);
        this._toolEquivalentIcon.hide();

        this._toolTimeBar = new BMapLib.ToolTimeBar();
        this._map.addControl(this._toolTimeBar);
        this._toolTimeBar.addEventListener("onselected", $.proxy(this.onTimeBarSelected, this));
        this._toolTimeBar.hide();
        

        // 信息框整体的缩放展开
        $('.bt-area').on('click', $.proxy(this.onAreaClick, this));
        // 信息框内的 panel 的缩放展开
        $('.panel-title a').on('click', $.proxy(this.onPanelCollapse, this));
        // echart 的放大缩小
        $('#fullChart').on('click', $.proxy(this.onChartOpen, this));
        $('.win-chart .win-close').on('click', $.proxy(this.onChartClose, this));

        this.main();
      }

    , main: function(){
        this._toolEquivalentIcon.hide();
        this._toolTimeBar.hide();
        switch(this._curMenuId)
        {
        case 'menu1':
          this._prepoint = null;
          this.addPoints();
          break;
        case 'menu2':
          this._toolEquivalentIcon.show();
          this.addHeatmap();
          break;
        case 'menu3':
          this._myDis.open();
          break;
        case 'menu4':
          this.addTrend();
          this._toolTimeBar.reset();
          this._toolTimeBar.show();
          break;
        case 'menu5':
          this.addForecast();
          this._toolTimeBar.reset();
          this._toolTimeBar.show();
          break;
        };
      }
    , addPoints: function(){
        this._map.clearOverlays();
        var datas = this.filertData();
        if (this._map.getZoom() < 12)
          this.addAreaPoints(datas);
        else
          this.addAllPoints(datas);
      }
    , addHeatmap: function(){
        this._map.clearOverlays();
        var datas = this.filertData();
        var points = [];
        for (var key in datas) {
          var point = this._pointDatas[key];
          points.push({"lng":point.lng, "lat":point.lat, "count":point.exponential*5});
        }
        if (this._heatmapOverlay == null) {
          // 生成热力图防止卡顿
          this._heatmapOverlay = new BMapLib.HeatmapOverlay({
            "radius": 80*(this._map.getZoom()-9)/2,
            "visible": true,
            "gradient": {
              0.2: "rgb(16,117,58)",
              0.3: "rgb(55,169,9)",
              0.4: "rgb(172,231,1)",
              0.7: "rgb(252,243,2)",
              0.8: "rgb(252,243,2)",
              1.0: "rgb(204,48,25)"
            }
          });
        } else {
          this._heatmapOverlay.setOptions({
            "radius": 80*(map.getZoom()-9)/2
          });
        }
        this._map.addOverlay(this._heatmapOverlay);
        this._heatmapOverlay.setDataSet({data:points,max:12});
      }
    , addTrend: function(cp){
        cp = cp || 1;
        console.log('Trend:'+cp);
      }
    , addForecast: function(cp){
        cp = cp || 1;
        console.log('Forecast:'+cp);
      }
    // 加载所有的监测点
    , addAllPoints: function(pointDatas){
        for (var key in pointDatas) {
          var pointData = pointDatas[key];
          var myRM = new BMapLib.MonitoringPoints(pointData);
          myRM.addEventListener("onmouseover", $.proxy(this.onMonitoringOver, this));
          myRM.addEventListener("onmouseout", $.proxy(this.onMonitoringOut, this));
          myRM.addEventListener("onclick", $.proxy(this.onMonitoringClick, this));
          this._map.addOverlay(myRM);
        }
      }
    // 加载区域的监测点
    , addAreaPoints: function(pointDatas){
        var key,areas = {};
        for (key in pointDatas) {
          var pointData = pointDatas[key];
          if (!areas.hasOwnProperty(pointData.areaName)) areas[pointData.areaName] = {count:0, exponential:0, lng:0, lat:0};
          areas[pointData.areaName].count++;
          areas[pointData.areaName].exponential += pointData.exponential;
          areas[pointData.areaName].lng += pointData.lng;
          areas[pointData.areaName].lat += pointData.lat;
        }
        for (key in areas) {
          var area = areas[key];
          var areaData = {
            areaName:key,
            count:area.count,
            exponential:area.exponential/area.count,
            lng:area.lng/area.count,
            lat:area.lat/area.count
          };
          var myRM = new BMapLib.AreaPoint(areaData);
          this._map.addOverlay(myRM);
        }
      }
    , sidebarInfo: function(params){
        // 更新基本信息
        var lineData = {
          name: params.name,
          chartData: [
            {"date":"2015-01","value":0.15},
            {"date":"2015-02","value":0.05},
            {"date":"2015-03","value":0.01},
            {"date":"2015-04","value":0.11},
            {"date":"2015-05","value":0.08},
            {"date":"2015-06","value":0.23},
            {"date":"2015-07","value":0.07},
            {"date":"2015-08","value":0.09},
            {"date":"2015-09","value":0.09},
            {"date":"2015-10","value":0.09},
            {"date":"2015-11","value":0.09},
            {"date":"2015-12","value":0.09}
          ]
        };
        var item = '<dt>%s:</dt><dd>%s</dd>';
        var html = '';
        switch(params.type){
          case 0:
            html += $.sprintf(item, '水源名称', params.name);
            html += $.sprintf(item, '污染指数', params.exponential);
            html += $.sprintf(item, '污染等级', params.exponentialDes);
            break;
          case 1:
            html += $.sprintf(item, '编号', params.name);
            html += $.sprintf(item, '单位名称', params.name);
            html += $.sprintf(item, '地址', params.address);
            html += $.sprintf(item, '区县', params.areaName);
            html += $.sprintf(item, '卫生许可证号', params.allowId);
            html += $.sprintf(item, '供水范围', params.acreage);
            html += $.sprintf(item, '水质指数', params.exponential);
            break;
          case 2:
            html += $.sprintf(item, '编号', params.name);
            html += $.sprintf(item, '地址', params.address);
            html += $.sprintf(item, '区县', params.areaName);
            html += $.sprintf(item, '所属单位', params.fname);
            html += $.sprintf(item, '水质指数', params.exponential);
            break;
        };
        $('.panel-body:first').html(html);


        // 更新折线图
        this._curChartData = lineData;
        var xAxisData = [];
        var yAxisData = [];
        for (var i in lineData.chartData) {
          xAxisData.push(lineData.chartData[i].date);
          yAxisData.push(lineData.chartData[i].value);
        }
        var eClartEl = $('.panel-body:eq(1) .echart');
        eClartEl.html();
        var eChart = echarts.init(eClartEl[0]);
        var option = {
          grid: {
            top: 10,
            left: 45,
            right: 10
          },
          color: ['#24B9F6'],
          xAxis: {
            axisLabel: {
              interval: 0,
              rotate: 270
            },
            data: xAxisData
          },
          yAxis: {},
          tooltip: {},
          series: [{
            type: 'line',
            data: yAxisData
          }]
        };
        eChart.setOption(option, true);
      }
    , winChartOpen: function(opened){
        var btFull = $('#fullChart');
        var win = $('.win-chart');
        var blockAll = $('.blockAll');
        if (opened == 'open') {
          btFull.addClass('opened');
          blockAll.show();
          win.show(300);
        } else {
          btFull.removeClass('opened');
          blockAll.hide();
          win.hide(300);
        }
        if (opened == 'open' && this._curChartData != null) {
          var xAxisData = [];
          var yAxisData = [];
          var thStr = '';
          var tdValStr = '';
          var tdLabStr = '';
          var BlLab = false;
          for (var i in this._curChartData.chartData) {
            xAxisData.push(this._curChartData.chartData[i].date);
            yAxisData.push(this._curChartData.chartData[i].value);
            thStr += $.sprintf('<th>%s</th>', this._curChartData.chartData[i].date);
            tdValStr += $.sprintf('<td>%s</td>', this._curChartData.chartData[i].value);
            BlLab = (this._curChartData.chartData[i].value <= 0.07);
            tdLabStr += $.sprintf('<td%s>%s</td>', (BlLab?' class="green"':''),(BlLab?'清洁':'微清洁'));
          }
          var eClartEl = win.find('.echart');
          eClartEl.html();
          var eChart = echarts.init(eClartEl[0]);
          var option = {
            grid: {
              top: 30,
              left: 40,
              right: 30,
              bottom: 25
            },
            color: ['#24B9F6'],
            xAxis: {
              axisLabel: {
                interval: 0
              },
              data: xAxisData
            },
            yAxis: {},
            tooltip: {},
            series: [{
              name:'水质指数',
              type: 'line',
              data: yAxisData,
              markPoint: {
                data: [
                  {type: 'max', name: '最大值'},
                  {type: 'min', name: '最小值'}
                ]
              },
              markLine: {
                data: [
                  {type: 'average', name: '平均值'}
                ]
              }
            }]
          };
          eChart.setOption(option, true);

          win.find('.win-title').html(this._curChartData.name);
          win.find('table thead tr').html(thStr);
          win.find('table tbody tr:eq(0)').html(tdValStr);
          win.find('table tbody tr:eq(1)').html(tdLabStr);
        }
      }




    , filertData: function(){
        var datas = [];
        if (this._prepoint != null) {
          for (var key in this._pointDatas) {
            var point = this._pointDatas[key];
            if (point.name == this._prepoint || point.prepoint == this._prepoint) datas.push(point);
          }
        } else if (this._pointFilterData != null) {
          for (var key in this._pointDatas) {
            var point = this._pointDatas[key];
            var pass = true;
            if (point.type == 0 && pointFilterData.prepoint.indexOf(point.name) == -1) pass = false;
            if (pointFilterData.areaName.indexOf(point.areaName) == -1) pass = false;
            if (point.type == 1 && pointFilterData.lvl.indexOf(point.lvl) == -1) pass = false;
            if (point.type == 2 && pointFilterData.mtd.indexOf(point.mtd) == -1) pass = false;
            if (point.type == 1 && pointFilterData.tapState.indexOf(point.state) == -1) pass = false;
            if (point.type == 2 && pointFilterData.rawState.indexOf(point.state) == -1) pass = false;
            if (pass == true) datas.push(point);
          }
        } else {
          datas = this._pointDatas;
        }
        return datas;
      }




    , onZoomend: function(e){
        this.main();
      }
    , onFilter: function(e){
        this._pointFilterData = e.data;
        this.main();
      }
    , onMenu: function(e){
        this._curMenuId = e.id;
        this.main();
      }
    , onMonitoringOver: function(e){
        if (!this._iconInfo) {
          var params = e.target._params;
          var data = {
            title: params.name,
            exponential: params.exponential,
            exponentialDes: params.exponentialDes,
            lng: params.lng,
            lat: params.lat
          };
          this._iconInfo = new BMapLib.MonitoringInfo(data);
          this._map.addOverlay(this._iconInfo);
        }
      }
    , onMonitoringOut: function(e){
        if (this._iconInfo != null) {
          this._map.removeOverlay(this._iconInfo);
          this._iconInfo = null;
        }
      }
    , onMonitoringClick: function(e){
        var params = e.target._params;
        var infoWinPoint = null;
        // console.log(params);
        this.sidebarInfo(params);

        if (this._infoWin != null) {
          infoWinPoint = this._infoWin.getPosition();
          this._infoWin.close();
          this._infoWin = null;
        }

        if (infoWinPoint != null && infoWinPoint.lng == params.lng && infoWinPoint.lat == params.lat) {
          this._prepoint = null;
          infoWinPoint = null;
        } else {
          // 查找父级和同纪
          if (params.prepoint != '')
            this._prepoint = params.prepoint;
          else if(params.type==1)
            this._prepoint = params.name;
          this.addPoints();

          // 绘制区域
          if (params.area.length > 0) {
            if (this._ply != null) this._map.removeOverlay(ply);
            var pts=[], i;
            for (i in params.area) {
              pts.push(new BMap.Point(params.area[i].lng, params.area[i].lat));
            }
            var areaColor = "#44B5DF";
            if(params.type == 1){
              areaColor = "#BAB2B2";
            }
            this._ply = new BMap.Polygon(pts,{fillColor:areaColor,fillOpacity:0.3,strokeWeight:1});
            this._map.addOverlay(this._ply);
          }

          this._infoWin = new BMapLib.WinInfo(this._map, params);
          this._infoWin.addEventListener('onclose', $.proxy(this.onInfoWinClose, this));

          this._infoWin.open(new BMap.Point(params.lng,params.lat));
          for (var i in this._map.getOverlays()) {
            var cur = this._map.getOverlays()[i];
            if (!cur.hasOwnProperty('_params') || !cur._params.hasOwnProperty('lng')) continue;
            if (cur._params.lng == params.lng && cur._params.lat == params.lat) {
              $(cur._container).find('a').addClass('selected');
            }
          }
        }
      }
    , onInfoWinClose: function(e){
        this._prepoint = null;
        this._infoWin = null;
        this.addPoints();
      }
    , onAreaClick: function(e){
        var isClose = $('.bt-area').hasClass('area-close')
        if (isClose)
          $('.bt-area').removeClass('area-close').addClass('area-open');
        else
          $('.bt-area').removeClass('area-open').addClass('area-close');
        $("#right_area").animate({width:(isClose?'345':'0')+'px'},100);
      }
    , onPanelCollapse: function(e){
        var cur = $(e.currentTarget)
          , isOpen = cur.hasClass('open')
          , body = cur.parent().parent().find('.panel-body');
        if (isOpen) cur.removeClass('open');
        else cur.addClass('open');
        body.slideToggle();
      }
    , onChartOpen: function(e){
        var btFull = $('#fullChart');
        if(btFull.hasClass('opened'))
          this.winChartOpen('close');
        else
          this.winChartOpen('open');
      }
    , onChartClose: function(e){
        this.winChartOpen('close');
      }
    , onTimeBarSelected: function(e){
        console.log('selected:'+e.selected);
        switch(this._curMenuId)
        {
        case 'menu4':
          this.addTrend(e.selected);
          break;
        case 'menu5':
          this.addForecast(e.selected);
          break;
        };
      }
  }
})();