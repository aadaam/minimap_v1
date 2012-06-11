minimap = (function(){
var max_zoomlevel = 20;
var bits_per_tile = 8;
var nr_of_bits = max_zoomlevel+bits_per_tile;
var nr_of_pixels_on_last_zoomlevel = 1 << nr_of_bits;
var Coordinate = function(lat,lng){
  var c=Math,o=c.min,p=c.max,i=c.log,q=c.tan,g=c.atan,j=c.exp,n=c.PI,f=n/4,h=n/2,b=180/n;
  this.lat = lat;
  this.lng = lng;
  this.x=Math.round((lng/360+0.5)*nr_of_pixels_on_last_zoomlevel);
  this.y=Math.round(o(1,p(0,0.5-(i(q(f+h*lat/180))/n)/2))*nr_of_pixels_on_last_zoomlevel);
}
Coordinate.prototype = {
  lat:undefined,
  lng:undefined,
  x:undefined,
  y:undefined,
  sub:function(coordinate){
    return {
      x:this.x - coordinate.x,
      y:this.y - coordinate.y
    }
  }
}

var coordinate = function(lat,lng){
  return new Coordinate(lat,lng);
}
var Map = function(canvas){
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width;
  this.height=canvas.height;
  var that=this;
  /*
  $(canvas).bind('drag', function(ev){
    that.onDrag(ev);
  });
  */
  var mouse_down = false;
  var mouse_last_pageX=0;
  var mouse_last_pageY=0;
  $(canvas).bind('mousedown', function(ev){
    mouse_down=true;
    mouse_last_pageX = ev.pageX;
    mouse_last_pageY = ev.pageY;
  });
  $(canvas).bind('mouseup', function(ev){
    mouse_down=false;
  });
  $(canvas).bind('mouseout', function(ev){
    mouse_down=false;
  });
  $(canvas).bind('mousemove', function(ev){
    var offsetX, offsetY;
    if (mouse_down){
      offsetX = ev.pageX - mouse_last_pageX;
      offsetY = ev.pageY - mouse_last_pageY;
      mouse_last_pageX = ev.pageX;
      mouse_last_pageY = ev.pageY;
      that.onDrag({
        offsetX:offsetX, 
        offsetY:offsetY, 
        origEv:ev
        });
    }
  });
  $(canvas).bind('dblclick',function(ev){
    that.zoom_in(ev);
  });
  var wheelhandler = function(ev){
    var wheel_property;
    if(ev.wheelDelta) wheel_property = ev.wheelDelta;
    if (ev.detail) wheel_property = (-1) * ev.detail;
    if(wheel_property >0){
      that.zoom_in(ev.offsetX ? ev: undefined);
    } else if (wheel_property <0){
      that.zoom_out(ev.offsetX ? ev:undefined);
    }
  }
  $(canvas).bind('DOMMouseScroll',wheelhandler);
  $(canvas).bind('mousewheel',wheelhandler);

}
Map.prototype = {
  canvas:undefined,
  ctx:undefined,
  topleft:undefined,
  width:undefined,
  height:undefined,
  tile_images:{},//TODO: this is static now, add to constructor
  zoomlevel:10,
  display:function(coordinate, zoomlevel){
    if (!zoomlevel) zoomlevel = this.zoomlevel;
    this.zoomlevel = zoomlevel;
    this.topleft=coordinate;
    this.render();
  },
  onDrag:function(ev){
    var inverse_zoom = max_zoomlevel - this.zoomlevel;
    this.topleft.x-= ev.offsetX << (inverse_zoom);
    this.topleft.y-= ev.offsetY << (inverse_zoom);
    this.render();
  },
  zoom_in:function(ev){
    if (this.zoomlevel < max_zoomlevel){
      if(ev){
        var inverse_zoom = max_zoomlevel - this.zoomlevel;
        var mapOffsetX = (ev.offsetX << (inverse_zoom -1 ));
        var mapOffsetY = (ev.offsetY << (inverse_zoom -1 ));
        // we want the same position to be retained
        // the effective pixel distance to topleft will be halved
        //therefore we move topleft by half
        this.topleft.x += mapOffsetX;
        this.topleft.y += mapOffsetY;
      }
      this.zoomlevel+=1;
      this.render();
    }
  },
  zoom_out:function(ev){
  /*
  klikkeltem 100x100-on, a szorzo 4x-es
  a terkepen ez a pont 400x400
  kinagyitok
  ha nem csinalok semmit, a pont 50x50-be megy at, a szorzo 8x-os
  szeretnem,ha a 400x400-as pont tovabbra is 100x100-on legyen
  ami ekkor 800x800

  */
    if (this.zoomlevel >1){
      if(ev){
        var inverse_zoom = max_zoomlevel - this.zoomlevel;
        var mapOffsetX = (ev.offsetX << (inverse_zoom  ));
        var mapOffsetY = (ev.offsetY << (inverse_zoom  ));
        // we want the same position to be retained
        // the effective pixel distance to topleft will be doubled
        // however, the meaning of the offset position will be halved
        //therefore we move topleft by the offset
        this.topleft.x -= mapOffsetX;
        this.topleft.y -= mapOffsetY;
      }
      this.zoomlevel-=1;
      this.render();
    }
  },
  pan_left:function(){
    var inverse_zoom = max_zoomlevel - this.zoomlevel;
    this.topleft.x-=(15 << inverse_zoom);
    this.render();
  },
  pan_right:function(){
    var inverse_zoom = max_zoomlevel - this.zoomlevel;
    this.topleft.x+=(15 << inverse_zoom);
    this.render();
  },
  pan_up:function(){
    var inverse_zoom = max_zoomlevel - this.zoomlevel;
    this.topleft.y-=(15 << inverse_zoom);
    this.render();
  },
  pan_down:function(){
    var inverse_zoom = max_zoomlevel - this.zoomlevel;
    this.topleft.y+=(15 << inverse_zoom);
    this.render();
  },
  render:function(){
    var inverse_zoomlevel = max_zoomlevel - this.zoomlevel;
    var pixel_zoom = inverse_zoomlevel + bits_per_tile;
    var topleft_column = this.topleft.x >> (pixel_zoom);
    var topleft_row = this.topleft.y >> (pixel_zoom);
    var bottomright_column = ((this.topleft.x+(this.width << inverse_zoomlevel)) >> (pixel_zoom)) +1;
    var bottomright_row = ((this.topleft.y+(this.height << inverse_zoomlevel)) >> (pixel_zoom))+1;
    var i,j;
    for (i=topleft_column;i <=bottomright_column;++i){
      for (j=topleft_row;j <=bottomright_row;++j){
        this.rendertile(i,j);
      }
    }
  },
  rendertile:function(column,row){
    var inverse_zoomlevel = max_zoomlevel - this.zoomlevel;
    this.grabtile(this.zoomlevel, column, row, function(tile_image, zoomlevel){
      if (zoomlevel == this.zoomlevel){
        var x = (column << bits_per_tile) - (this.topleft.x >> inverse_zoomlevel);
        var y = (row << bits_per_tile) - (this.topleft.y >> inverse_zoomlevel);
        this.ctx.drawImage(tile_image, x,y);
      }
    });
  },
  grabtile:function(zoomlevel, column,row,onload){
    var id = [zoomlevel, column, row].join("/");
    var that =this;
    if (!this.tile_images[id]){
      this.tile_images[id] = new Image();
      this.tile_images[id].src = "http://"+['a','b','c'][Math.floor(Math.random()*3)]+".maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/normal.day/"+id+"/256/png8";
      this.tile_images[id].onload = function(){
        onload.call(that, that.tile_images[id], zoomlevel);
      }
    } else {
        onload.call(that, that.tile_images[id], zoomlevel);
    }
  }
}
var map = function(canvas){
  return new Map(canvas);
}
return {
  coordinate:coordinate,
  map:map
}
})();
