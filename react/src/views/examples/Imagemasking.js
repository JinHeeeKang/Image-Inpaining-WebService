import React, { useState } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { styles } from './styles'
import { Link, useLocation } from "react-router-dom";
import Sketch from "react-p5"; 
import IndexNavbar from "components/Navbars/IndexNavbar.js";

import { Redirect } from 'react-router-dom';
import Loader from "react-loader-spinner";
// import Modal from 'react-modal';

import {
  Button,
  Container,
  Row,
  Col,

} from "reactstrap";


const Masking_Images = (props) => {

    let localimg = NaN;
    let newcanvers = NaN;
    let filedata =NaN;


    const location = useLocation();
    const imageurl = location.state.croppedImage;

    let cropimagURL= NaN;
    let maskingimagURL= NaN;
    let canvasBolb = NaN;

    const [maskedori_url,setReturnURL1] = useState("test 111")
    const [result_url,setReturnURL2] = useState("test 222")
    const [redirect,setRedirect]=useState(false);
    const [loading, setLoading] = useState(false);
    
    
    /*mask 에 사용되는 함수*/
    const preload = (p5) => {
      localimg = p5.loadImage(imageurl);
      
    };
    const setup = (p5, canvasParentRef) => {
      newcanvers = p5.createCanvas(512, 512).parent(canvasParentRef)
      p5.tint(255, 0);
      p5.image(localimg, 0, 0);
    };


    const draw = (p5) => {
       p5.stroke(255);
      if (p5.mouseIsPressed === true) {
        p5.line(p5.mouseX, p5.mouseY, p5.pmouseX, p5.pmouseY);
      }
      p5.strokeWeight(20);      
    };


    const clear= ()=>{
      const newcanvers = document.getElementById('defaultCanvas0');
      const context = newcanvers.getContext('2d');
      context.clearRect(0, 0, newcanvers.width, newcanvers.height);
    }


    /*s3에 전송-original*/
    const handlePost_ori = async () => {
      console.log("이미지 저장 시작");
      await fetch(imageurl)
      .then(res => res.blob())
      .then(blob => {
        filedata = new File([blob], "original.png", {
              type: 'image/png'
          });
      });

      const formData = new FormData();
      formData.append("file",filedata)
      // console.log(filedata);
      let url = "http://15.165.112.235:7777/api/upload_ori"
      await fetch(url, {
        method: "POST",
        body: formData,
      })
      .then((res)=>res.json())
      .then((data) => {
        console.log("ori",data.body.location)
        // alert("성공");
        cropimagURL=data.body.location
        console.log("cropimagURL",cropimagURL)
      })
      .catch((err) => {
        // alert("실패");
      });
      
    }

    /*s3에 전송-mask*/
    const handlePost_mask = async () => {
      
      let myCanvas = document.getElementById("defaultCanvas0");
      // console.log("myCanvas",myCanvas)
      let data = myCanvas.toDataURL();
      // console.log("data",data)

      console.log("이미지 저장 시작");
      await fetch(data)//mask 이미지
      .then(res => res.blob())
      .then(blob => {
        canvasBolb = new File([blob], "mask.png", {
              type: 'image/png'
          });
      });


      const formData = new FormData();
      formData.append("file",canvasBolb)
      console.log(canvasBolb);
      let url = "http://15.165.112.235:7777/api/upload_mask"
      await fetch(url, {
        method: "POST",
        body: formData,
      })
      .then((res)=>res.json())
      .then((data) => {
        console.log("mask",data.body.location)
        // alert("성공");
        maskingimagURL=data.body.location
        console.log("maskingimagURL",maskingimagURL)
      })
      .catch((err) => {
        // alert("실패");
      });
    }

    /* Flask에 ori,mask 이미지 url 전송 */
    const handlesendtoFlask = async() => {
      console.log("handlesendtoFlask start")
    
      const data = {
        analysis_filename : 'test.jpg',
        mask_filename : 'mask_test.jpg',
        analysis_url:cropimagURL,
        mask_url:maskingimagURL
      }
      console.log("test11",cropimagURL);
      console.log("test22",maskingimagURL);
      console.log("json", JSON.stringify(data));

      let url = "http://15.165.112.235:5004/process";
      await fetch(url,{
        method: "POST",
        body: JSON.stringify(data),
        cache: "no-cache", 
        header: {
          "Content-Type": "application/json",
        }
      })
      .then((res)=>res.json())
      .then((data)=>{
        // console.log(data.url1);
        // console.log(data.url2);

        setReturnURL1(data.url1);//maskedori_url
        setReturnURL2(data.url2);//result_url
        setRedirect(true);
        console.log("3.loading:::", loading)
        setLoading(false);
        console.log("4.loading:::", loading)
      })
    }

    const Loading = async()=>{
        // await setTimeout(()=>setLoading(true), 100);
        // await setTimeout(()=>setLoading(false), 8600);
        console.log("1.loading:::", loading)
        setLoading(true);
        console.log("2.loading:::", loading)

        
    }

    if (loading){
      console.log('??',loading)
      return ( 
      <div style={{ 
          position: "fixed", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)" 
          
          }}> 
            <Loader type="Grid" color="#00BFFF" height={300} width={300} />
 
      </div>
      );
      } 


    const handlePost_2image = async ()=>{
        

        await handlePost_mask();
        await handlePost_ori();

        await Loading();

        await handlesendtoFlask();
      
    }

    

    if (redirect) {
      return (
        <Redirect to={{
          pathname:"/Modeling",
          state:{url1:maskedori_url,
                  url2:result_url,
                  cropimagURL:imageurl}
                  
      }}
    />);
  }
  



    return (
      <>
        <IndexNavbar />

        <div>
          <div className="page-header clear-filter" filter-color="blue"
            position="center">
        <Container>
          <Container>
          < Row>
              <Col>
            <h2 className="title">마스킹 부위 선택</h2>

            <img src={imageurl}/>
            
            <div className="test-remaper">
            <Sketch preload={preload} setup={setup} draw={draw} /> 
            </div>

            </Col>
            </Row>
          </Container>

          <Container>
         
            <Button
            className="btn-neutral btn-round"
            color="info"
            size="lg"
            variant="contained"
            to="/Imageselect"
            tag={Link}
            >
              이전 단계
            </Button>
           
            <Button
            className="btn-neutral btn-round"
            color="info"
            size="lg"
            onClick={clear}
            variant="contained"
            >
              리셋
            </Button>
          
            <Button
            className="btn-neutral btn-round"
            color="info"
            size="lg"
            variant="contained"
            onClick={handlePost_2image}
            >
              모델 적용
            </Button>
         
          </Container>

          

        
          {console.log(maskedori_url)}
          {console.log(result_url)}

        </Container>

        </div>
        </div>

      </>
    );
  }

  const Imagemasking = withStyles(styles)(Masking_Images)
  
export default Imagemasking;


