import React, { Component } from 'react';
import xml2js from 'xml2js';
import './App.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.css';
import $ from 'jquery';
import ReactHTMLTableToExcel from 'react-html-table-to-excel';

let xml = require('./out.xml');
let screenShot = require('./screenshot.png');
let styles = {
  image : {
    width :'100%'
  },
  imgContainer : {
    cursor: 'pointer',
    zIndex: 1000,
    left: 0,
    top: 0,
    position: 'absolute',
    width: "100%",
    height: "100%",
    paddingLeft: '15px',
    paddingRight: '15px'
  },
  divStyle : {
    fill:"#25ad9f",
    stroke:"black",
    strokeWidth:1,
    opacity:0
  }
}

class App extends Component {

  constructor(props) {
    super(props);
    this.state = { properties:[], selectedProps:[], width: '', height: '', nodeProperties:[],coordinates:'', user_actions:[] };
  }

  componentDidMount() {
    var that = this;
    axios.get(xml)
      .then(function (response) {
        let xmlResponse = response.data;
        xml2js.parseString(xmlResponse,function(err,result){
          that.getProperties(result.hierarchy.node,0);
        })
      })
      .then(function(){
        var coordinates = that.getCoordinates();
        that.setState({coordinates:coordinates})
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  getProperties = (xmlData,index) => {
    var that = this;
    let temp = [];
    xmlData.forEach(function(obj) {
      let li_element = that.formLi(obj.$, index);
      index++;
      that.setState((state) => { nodeProperties: state.nodeProperties.push(obj.$);});
      temp.push(li_element);
      if(obj.hasOwnProperty('node')) {
        let returnProps = that.getProperties(obj.node, index);
        index = returnProps['index'];
        let childStructure = returnProps['structure'];
        temp.push(that.formUl(childStructure, 'ul'+index));
      }
    });
    that.setState({properties:temp,});
    return {'index': index, structure: temp};
  }

  formLi = (data,index) => {
    return <li id={index} key={index} onMouseOver={()=>this.mouseEnter(index)} onClick={()=>this.liClick(data,index)}>{data.class}</li>;
  }

  mouseEnter = (index) => {
    $("#svgContainer rect").css({'opacity':0});
    $("#svgContainer #"+index+"").css({'opacity':0.5});
  }

  formUl = (data,index) => {
    return <ul key={index}>{data}</ul>;
  }

  liClick = (data,index) => {
      let actions=[];
      actions['element'] = "li";
      actions['text'] = data.text;
      this.setState({selectedProps:data});
      this.setState((state) => { user_actions: state.user_actions.push(actions); });
  }


  imageClick = (data,index) => {
    console.log("clicked");
      let actions=[];
      actions['element'] = "image";
      actions['text'] = data.text;
      this.setState({selectedProps:data});
      this.setState((state) => { user_actions: state.user_actions.push(actions); });
  }

  onImgLoad = ({target:img}) => {
    this.setState({height:img.offsetHeight,width:img.offsetWidth});
  }

  getCoordinates = () => {
    let nodeProperties = this.state.nodeProperties, width, height, resizeWidth = this.state.width/1080, resizeHeight = this.state.height/1920;
    return (
      nodeProperties.map((obj,key) => {
        let {divStyle} = styles;
        var bounds = obj.bounds.replace('][',',').replace('[','').replace(']','');
        var splitBounds = bounds.split(',');
        width = (splitBounds[2] - splitBounds[0])*Number(resizeWidth);
        height = (splitBounds[3] - splitBounds[1])*Number(resizeHeight);
        return <rect id={key} onMouseOver={()=>this.mouseEnter(key)} onClick={()=>this.imageClick(obj,key)} key={key} x={splitBounds[0]*resizeWidth} y={splitBounds[1]*resizeHeight} width={width} height={height} style={divStyle} />
      })
    )
  }

  render() {

    let {image,imgContainer} = styles;

    let selectedProps = this.state.selectedProps;
    let user_actions=this.state.user_actions;

    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-6" id="screen">
             <img onLoad={this.onImgLoad} alt="screenshot" src={screenShot} style={image}/>
              <svg id="svgContainer" style={imgContainer}>
                {this.state.coordinates}
              </svg>
          </div>
          <div className="col-sm-6">
            <ul>{this.state.properties}</ul>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <ReactHTMLTableToExcel
                    id="test-table-xls-button"
                    className="download-table-xls-button"
                    table="table-to-xls"
                    filename="tablexls"
                    sheet="tablexls"
                    buttonText="Download as XLS"/>
            <table id="table-to-xls" className="table table-bordered">
              <tbody>
                {
                  Object.keys(user_actions).map(function(obj,i) {
                    return <tr key={i}><td>{user_actions[obj].element}</td><td>{user_actions[obj].text}</td></tr>
                  })
                }
              </tbody>
            </table>
          </div>
          <div className="col-sm-6">
            <table className="table table-bordered">
              <tbody>
                {
                  Object.keys(selectedProps).map(function(propName, propIndex) {
                    return <tr key={propIndex}><td>{propName}</td><td>{selectedProps[propName]}</td></tr>
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default App;