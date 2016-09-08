var MyLib = window.MyLib = MyLib || {};
(function(){
  var YYSJC = MyLib.YYSJC = function (pointDatas, pointAllDatas,pointAllDatas_F) {
    if (!pointDatas) return
    this._data = this._pointDatas = pointDatas
    this._pointAllDatas = pointAllDatas
	this._pointAllDatas_F = pointAllDatas_F
    this.init()
  }
  MyLib.YYSJC.prototype = {
      constructor: MyLib.YYSJC
    , _pointAllDatas: null // 趋势
	, _pointAllDatas_F: null //预测
    , _data: null // 数据
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
        $(window).on('resize', $.proxy(this.onPanelCollapseProgress, this));
        // echart 的放大缩小
        $('#fullChart').on('click', $.proxy(this.onChartOpen, this));
        $('.win-chart .win-close').on('click', $.proxy(this.onChartClose, this));

        this.main();
        this.onPanelCollapseProgress();
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
          this._toolTimeBar.reset(this._pointAllDatas);
          this._toolTimeBar.show();
          break;
        case 'menu5':
          this.addForecast();
          this._toolTimeBar.reset(this._pointAllDatas_F);
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
            "radius": 20+(this._map.getZoom()-10)*30,
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
        }
        this._map.addOverlay(this._heatmapOverlay);
        this._heatmapOverlay.setDataSet({data:points,max:12});

        if (this._heatmapOverlay != null) {
          this._heatmapOverlay.setOptions({
            "radius": 20+(this._map.getZoom()-10)*30
          });
        }
      }
    , addTrend: function(cp,data){
        cp = cp || 1;
        console.log('Trend:'+cp);
        this._pointDatas = data;
        this.addPoints();
      }
    , addForecast: function(cp,data){
        cp = cp || 1;
        console.log('Forecast:'+cp);
        this._pointDatas = data;
        this.addPoints();
      }
    // 加载所有的监测点
    , addAllPoints: function(pointDatas){
        for (var key in pointDatas) {
          var pointData = pointDatas[key];
          var dashed = (this._curMenuId=='menu5'?true:false)
          var myRM = new BMapLib.MonitoringPoints(pointData, dashed);
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

        this.addJVInfo(pointsJVData);
        $('.last-body .top input:checkbox[name=s]').on('ifChanged', $.proxy(this.onRefreshJVInfo, this, pointsJVData));
        $('.last-body .top select').on('change', $.proxy(this.onRefreshJVInfo, this, pointsJVData));
        $('.last-body .top .btn-reset').on('click', $.proxy(this.onJVReset, this, pointsJVData));

        this.onRefreshJVInfo(pointsJVData);
        this.onPanelCollapseProgress();
      }
    , addJVInfo: function(jvData){
        var i,j,curLsn,curLsv,curLsvn,
            htmlLsn = '<option value="all">所有</option>',
            htmlDate = '',
            lsnArr = [],
            dateArr = []
            lastbody = $('.last-body .top');
        for (i in jvData) {
          if (dateArr.indexOf(jvData[i].date) == -1) dateArr.push(jvData[i].date);
          for (j in jvData[i].lsn) {
            curLsn = jvData[i].lsn[j];
            curLsv = jvData[i].lsv[j];
            curLsvn = jvData[i].lsvn[j];
            if (lsnArr.indexOf(curLsn) == -1) lsnArr.push(curLsn);
          }
        }
        for (i in lsnArr)
          htmlLsn += $.sprintf('<option value="%s">%s</option>', lsnArr[i], lsnArr[i]);
        lastbody.find('select[name=lsn]').html(htmlLsn);
        for (i in dateArr)
          htmlDate += $.sprintf('<option value="%s">%s</option>', dateArr[i], dateArr[i]);
        lastbody.find('select[name=date]').html(htmlDate);

        $('.last-body .top input:checkbox[name=s]').iCheck('check');
      }
    , winChartOpen: function(opened){
        var btFull = $('#fullChart');
        var win = $('.chart1');
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
            if (this._curChartData.chartData[i].hasOwnProperty('r')) {
              BlLab = (this._curChartData.chartData[i].r == '合格');
              tdLabStr += $.sprintf('<td%s>%s</td>', (BlLab?' class="green"':''),(BlLab?'合格':'不合格'));
            } else {
              BlLab = (this._curChartData.chartData[i].value <= 0.07);
              tdLabStr += $.sprintf('<td%s>%s</td>', (BlLab?' class="green"':''),(BlLab?'清洁':'微清洁'));
            }
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
            if (point.type == 0 && this._pointFilterData.prepoint.indexOf(point.name) == -1) pass = false;
            if (this._pointFilterData.areaName.indexOf(point.areaName) == -1) pass = false;
            if (point.type == 1 && this._pointFilterData.lvl.indexOf(point.lvl) == -1) pass = false;
            if (point.type == 2 && this._pointFilterData.mtd.indexOf(point.mtd) == -1) pass = false;
            if (point.type == 1 && this._pointFilterData.tapState.indexOf(point.state) == -1) pass = false;
            if (point.type == 2 && this._pointFilterData.rawState.indexOf(point.state) == -1) pass = false;
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
            type: params.type,
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
        /*
        var cur = $(e.currentTarget)
          , isOpen = cur.hasClass('open')
          , body = cur.parent().parent().find('.panel-body');
        if (isOpen) cur.removeClass('open');
        else cur.addClass('open');
        body.slideToggle({progress:$.proxy(this.onPanelCollapseProgress, this)});
        */
        var cur = $(e.currentTarget)
          , body = cur.parent().parent().find('.panel-body');
        $('.panel-title a').removeClass('open');
        cur.addClass('open');
        $('.panel-body').slideUp({progress:$.proxy(this.onPanelCollapseProgress, this)});
        body.clearQueue().slideDown({progress:$.proxy(this.onPanelCollapseProgress, this)});
      }
    , onPanelCollapseProgress: function(){
        var panels = $('.panel-group')
          , lastPanel = panels.find('.panel:last .last-body')
          , lastPanelPoint = lastPanel.offset();
        lastPanel.css('height', (panels.height()-lastPanelPoint.top-15)+'px');
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
          this.addTrend(e.selected,e.data);
          break;
        case 'menu5':
          this.addForecast(e.selected,e.data);
          break;
        };
      }
    , onRefreshJVInfo: function(jvData){
        var i,j,
            lastbody = $('.last-body .top'),
            sVal = []
            lsnVal = lastbody.find('select[name=lsn]').val(),
            dateVal = lastbody.find('select[name=date]').val(),
            trhtml = '';

        lastbody.find('input:checkbox:checked').each(function(){
          sVal.push($(this).val());
        });

        for (i in jvData){
          if (sVal.indexOf(jvData[i].s) == -1) continue;
          if (jvData[i].date != dateVal) continue;
          for (j in jvData[i].lsn){
            if (lsnVal == 'all' || jvData[i].lsn[j] == lsnVal) {
              trhtml += $.sprintf(
                '<tr><td>%s</td><td><img style="vertical-align:middle" src="img/icon_%s.png">%s</td><td>%s</td></tr>',
                jvData[i].lsn[j],
                jvData[i].lsvn[j] == '合格'?'y':'n',
                jvData[i].lsv[j],
                jvData[i].date
              );
            }
          }
          if (trhtml != '') break;
        }
        $('.last-body .bottom tbody').html(trhtml);
        $('.last-body .bottom tbody tr').on('click', $.proxy(this.onJVClick, this))
      }
    , onJVClick: function (e){
        var cur = $(e.currentTarget);
        console.log(cur.length);
        this._curChartData = {
          name: cur.find('td:eq(0)').text(),
          chartData: [
            {"date":"2016-01-12","value":"0.07","r":"合格"},
            {"date":"2016-02-12","value":"0.17","r":"合格"},
            {"date":"2016-03-12","value":"0.22","r":"合格"},
            {"date":"2016-04-12","value":"0.01","r":"合格"},
            {"date":"2016-05-12","value":"0.25","r":"合格"},
            {"date":"2016-06-12","value":"0.78","r":"合格"},
            {"date":"2016-07-12","value":"1.07","r":"不合格"},
            {"date":"2016-08-12","value":"0.27","r":"合格"}
          ]
        };
        this.winChartOpen('open');
      }
    , onJVReset: function(jvData){
        this.addJVInfo(jvData);
        this.onRefreshJVInfo(jvData);
      }
  }
})();