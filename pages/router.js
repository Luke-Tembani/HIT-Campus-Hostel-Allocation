const express = require('express');
const { CLIENT_MULTI_RESULTS } = require('mysql/lib/protocol/constants/client');
const db = require('../databaseConnection');
const nodemailer = require('nodemailer');
const alert = require('alert');
const router = express.Router();
var roomCounter = 768;



//Home - Login 
router.get('/',(req,res)=>{
    res.render('login',{Message:''});
})
router.get('/status',(req,res)=>{
    let email = req.session.email;
    db.query('SELECT * FROM allocated WHERE email =?',[email],async(error,result)=>{
        if(error) throw error

        if(result.length==1){
            let status = 'Allocated';
            res.render('status',{status});

        }else{
            let status = 'Pending';
            res.render('status',{status});
        }
    })
})


//view allocated
router.get('/viewallocated',(req,res)=>{

    db.query('SELECT * FROM allocate',async(error,result)=>{

        let allocated = [];
        allocated = result;

        res.render('allocated',{allocated});
    })
});


//Waden allocated

router.get('/wadenallocated',(req,res)=>{
    db.query('SELECT * FROM allocated',(error,result)=>{

        let allocated  = [];
        allocated = result;
        res.render('wadenallocated',{allocated});

    }) 
});

//Waden : Checkin
router.post('/checkin/:id',(req,res)=>{
    const id = req.params.id;

    db.query('SELECT * FROM allocated WHERE id  =?',[id],async(error,result)=>{

        if(error) throw error

        let allocated = [];
        allocated =result;

        allocated.forEach(data=>{

            db.query('INSERT INTO checkedin SET?',{email:data.email},async(error)=>{

                if(error) throw error
                let newStatus = 'CheckedIn'

                db.query('UPDATE allocated SET status = ? WHERE id = ?',[newStatus,id],async(error)=>{
                    if(error) throw error

                    db.query('SELECT * FROM allocated',(error,result)=>{
                        if(error) throw error

                        let allocated = [];
                        allocated = result;

                        res.render('wadenallocated',{allocated});
                        
                    })
                })


               
            })



        })



    })



    
});


//Waden: Checkin
router.get('/checkedin',(req,res)=>{

    db.query('SELECT * FROM checkedin',(error,result)=>{

        let checkedin = [];
        checkedin = result;
        res.render('wadencheckedin',{checkedin,Message:''});
        
    })

    //checkout
    router.post('/checkout/:id',(req,res)=>{
        const id = req.params.id;

        db.query('DELETE from checkedin WHERE id = ?',[id],async(error,result)=>{
            if(error) throw error


            db.query('SELECT * FROM checkedin',async(error,result)=>{

                if(error) throw error

                let checkedin = [];
                checkedin =result;

                res.render('wadencheckedin',{checkedin,Message:'Successfully Checked Out'});
            })


        })

    


        
    })


    //DO THE CHECK OUT


});


//view applicants
router.get('/viewapplicants',(req,res)=>{

    res.render('viewApplicants');
})


//set price
router.get('/setprice',(req,res)=>{

    res.render('setprice',{Message:''});
})


//Retrieve credentials from database
router.post('/login',(req,res)=>{
    const {email,password} = req.body;
    db.query('SELECT * FROM students WHERE email =? AND password = ?',[email,password],async(error,result)=>{
        if(error) throw error;
        if(result.length == 1){
            req.session.email = email;
            let studentName = req.session.email;
            res.render('studentDashboard',{studentName});
        }else{
            db.query('SELECT * FROM admin WHERE email = ? AND password =?',[email,password],async(error,result)=>{
                if(error) throw error
                if(result.length == 1){
                    req.session.email = email;
                    let adminName = req.session.email;
                    res.render('adminDashboard',{adminName});
                }
                else{
                    db.query('SELECT * FROM wadens WHERE email = ? AND password =?',[email,password],async(error,result)=>{

                        if(error) throw error
                        if(result.length==1){
                            req.session.email = email;
                            let wadenName = req.session.email;
                            res.render('wadendashboard',{wadenName});
                        }

                        else{
                            res.render('login',{Message:'Account Not Found'});
                        }
                    })
                }

            })
        }
    
    })
});

//VIEW ADMIN DASHBOARD
router.get('/admindash',(req,res)=>{

let adminName = req.session.email;
    res.render('adminDashboard',{adminName});
})

//ALLOCATED STUDENTS
router.get('/allocated',(req,res)=>{

    db.query('SELECT * FROM allocated',async(error,result)=>{

        let allocated = [];
        allocated = result;

        res.render('allocated',{allocated});
    })
    
});

//APPLICANTS
router.get('/applicants',(req,res)=>{

    db.query('SELECT * FROM applicants',async(error,result)=>{
        if(error) throw error

        let applicants = [];
        applicants = result;

        res.render('applicants',{applicants});
    })
});

//Students
router.get('/students',(req,res)=>{

    res.render('students');
})


//logout
router.get('/logout',(req,res)=>{
    req.session.email = null;
    req.session.destroy();

    res.redirect('/');
})

router.get('/apply',(req,res)=>{

    if(!req.session.email){
        res.redirect('/')
    }else{

        res.render('application',{Message:''})
    }

})

//Applying for vacancy
router.post('/apply',(req,res)=>{

    const{regnum,gender,hostel,part,semester} = req.body;

    if(!req.session.email){
        res.redirect('/');

    }else{

        db.query('SELECT * FROM applicants WHERE email =?',[req.session.email],async(error,result)=>{

            if(error) throw error

            if(result.length>0){
                res.render('application',{Message:'Already Applied, wait for allocation'})
            }else{

                db.query('INSERT INTO applicants SET?',{email:req.session.email,part:part,hostel:hostel,semester:semester,gender:gender,regnum:regnum},async(error)=>{


                    if(error) throw error
        
        
                    res.render('application',{Message:'Successfully Applied'});
                })
            }
        })

       

    }
})


//Random RES ALLOCATION

/**
 * Open application platform
 * Assign consecutive numbers[CN] to applicants limit Males to 224 and F - 160
 * Generate 96 different room numbers[RN];
 * 
 * check where[A] :- [CN] === [RN]  add to array
 * Allocated res to [A];
 * 
 * 
*/
//random alloation


router.get('/applyvacant',(req,res)=>{

    if(!req.session.email)
    
       {
        res.redirect('/');

       }

    else
    {
        let name = req.session.email;
        db.query('SELECT * FROM students WHERE email =?',[name],async(error,result)=>{
            if(error) throw error
            result.forEach(element=>{
                if(element.FeesBalance < 42000)   
                {
                    res.send('ERROR, FEES TOO LOW TO APPLY')
                }
                else           
                {
                    db.query('SELECT * FROM applicants WHERE email =?',[name],async(error,result)=>{
                        if(error) throw error
                        if(result.length>0){
                            res.send("Already Applied");
                        }                        
                        else
                        {
                            db.query('INSERT INTO applicants SET?',{email:name},(error,result)=>{
                                if(error) throw error
                                roomCounter--;
                                console.log(roomCounter);

                                res.render('studentDashboard',{studentName:req.session.email});
                            })

                        }
                    })

                }

            })
        })

    }  
    })

//Done
router.get('/hostel',(req,res)=>{

    let H1,H2,H3,H4 = 0;
    
    db.query('SELECT * FROM vacancies',async(error,result)=>{
        if(error) throw error
        let hostels = [];
        hostels = result;

        hostels.forEach(data=>{
            if(data.id==1){
                H4=data.price
            }

            if(data.id==2){
                H3=data.price;
            }

            if(data.id==3){
                H2=data.price;
            }

            if(data.id==4){
                H1=data.price;
            }

           
        })
        res.render('viewhostel',{hostels,H1,H2,H3,H4});



 
    })
})

//Setting Price

router.post('/setprice',(req,res)=>{

    const{h1,h2,h3,h4}  =req.body;

    db.query('UPDATE vacancies SET price = ? WHERE id = 4',[h1],(error)=>{

        if(error) throw error

        db.query('UPDATE vacancies SET price = ? WHERE id = 3',[h2],(error)=>{

            if(error) throw error

            db.query('UPDATE vacancies SET price = ? WHERE id = 2',[h3],(error)=>{

                if(error) throw error

                db.query('UPDATE vacancies SET price = ? WHERE id = 1',[h4],(error)=>{

                    if(error) throw error


                    res.render('setprice',{Message:'Successfully Updated Hostel Prices'});

                })

            })
        })
    })
})

//Allocate Vacancies
router.get('/allocate',(req,res)=>{
    //Allocate to all Part 4s First
    let firstSelector = 4;
    let secondSelector = 3;
    let thirdSelector = 1;
    let forthSelector = 2;
    db.query('SELECT * FROM applicants WHERE part =?',[firstSelector],async(error,result)=>{
        if(error) throw error
        result.forEach(element=>{
            db.query('INSERT INTO allocated SET?',{email:element.email,part:element.part},async(error,result)=>{
                if(error) throw error
                //Allocate Part 4s
            })
        })


        db.query('SELECT * FROM applicants WHERE part =?',[secondSelector],async(error,result)=>{

            if(error) throw error

            result.forEach(element=>{

                db.query('INSERT INTO allocated SET?',{email:element.email,part:element.part},async(error,result)=>{

                    if(error) throw error

                    //Allocate PART 3s


                })

            })


            db.query('SELECT * FROM applicants WHERE part =?',[thirdSelector],async(error,result)=>{

                if(error) throw error

                result.forEach(element=>{

                    db.query('INSERT INTO allocated SET?',{email:element.email,part:element.part},async(error,result)=>{

                        if(error) throw error


                        //Allocate Part 1s
                    })
                })

                db.query('SELECT * FROM applicants WHERE part =?',[forthSelector],async(error,result)=>{

                    if(error) throw error

                    result.forEach(element=>{


                        db.query('INSERT INTO allocated SET?',{email:element.email,part:element.part},async(error,result)=>{

                            if(error) throw error

                            //Allocate part 2s


                            res.send('Process Finished...')
                        })
                    })
                })


                



            })


            

            



        })


        
    
    })
})


router.get('/registration',(req,res)=>{


    res.render('registration');
})

router.get('/studentdash',(req,res)=>{


    res.render('studentDashboard')
})


router.get('/apply',(req,res)=>{

    res.render('studentDashboard',{studentName:req.session.email});
})


router.get('/generate',(req,res)=>{
    db.query('SELECT * FROM allocated',async(error,result)=>{
        if(error) throw error

        let emails = [];
        emails = result;
        
        emails.forEach(element=>{

            let mailList = [];
            mailList.push(element.email);

            console.log(mailList);
        })
    })
})

router.get('/random',(req,res)=>{


function between(min, max) {  
    return Math.floor(
      Math.random() * (max - min) + min
    )
  }
  
  // Example:
  
  console.log(between(10, 200)
  )
  // 199 (this may vary for you :) )
})

//Open Send Mail
router.get('/sendmail',(req,res)=>{


    res.render('sendmail',{Message:''});
})


//Send Email

router.post('/sendMail',(req,res)=>{

    db.query('SELECT * FROM allocated',async(error,result)=>{
        if(error) throw error

        let emails = [];
        emails = result;
        
        emails.forEach(element=>{

            let mailList = [];
            mailList.push(element.email);

            
    var transporter = nodemailer.createTransport({

        service:'gmail',
        auth: {
            user:'hit.hostelreservation@gmail.com',
            pass:'computerscience22'
        }
    });


    var mailOptions = {
        from:'hit.hostelreservation@gmail.com',
        to:mailList,
        subtext:'INFO',
        text: 'Congratulations, You have been allocated campus residence at HIT, Log in to your portal and pay up!'  //Html templates 
    };



    transporter.sendMail(mailOptions,(error,info)=>{

        if(error){
            console.log(error);
        }

        else{
            res.render('sendmail',{Message:'Emails Sent Successfully'});
        }
    });

        })
    })



    
})





module.exports = router;