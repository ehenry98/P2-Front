var imageFile;
var imageUrl;
var workerImageFile;
var workerImageUrl;

const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();
const cookieName = 'user';
const wResultsCookie = 'workerResults'
//Redirect
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    console.log('admin in session');
    if (
      window.location.href.search('index.html') !== -1 ||
      window.location.href.search('login.html') !== -1
    ) {
      window.location.href = 'list.html';
    }
  } else {
    if (getCookie(cookieName)) {
      console.log('worker in session');
      if (window.location.href.search('question.html') === -1) {
        window.location.href = 'question.html';
      }
    } else {
      console.log('no user in session');
      if (
        window.location.href.search('login.html') === -1 &&
        window.location.href.search('index.html') === -1 &&
        window.location.href.search('register.html') === -1
      ) {
        window.location.href = 'index.html';
      }
    }
  }
});

function setCompanyPicture(event) {
  imageFile = event.target.files[0];
}

function setWorkerPicture(event) {
  workerImageFile = event.target.files[0];
}

function createCompany() {
  const agentName = document.getElementById('agentName').value;
  const companyName = document.getElementById('company').value;
  const docType = document.getElementById('docType').value;
  const docNum = document.getElementById('docNum').value;
  const phone = document.getElementById('phone').value;
  console.log(agentName);
  console.log(currentUser.uid);
  db.ref('companies/' + currentUser.uid).set({
    id: currentUser.uid,
    agentName: agentName,
    companyName: companyName,
    docType: docType,
    docNum: docNum,
    phone: phone,
    photoUrl: imageUrl,
    admin: true,
  });
  console.log('Empresa creada');
}

function registerCompany() {
  event.preventDefault();
  var userEmail = document.getElementById('userEmail').value;
  var userPassword = document.getElementById('userPassword').value;
  auth
    .createUserWithEmailAndPassword(userEmail, userPassword)
    .then(function (data) {
      console.log(data);
      console.log('Usuario empresa registrado');
    })
    .catch(function (error) {
      console.log('ErrorCode: ' + error.code + ', message: ' + error.message);
    });
  auth.onAuthStateChanged(function (user) {
    if (user) {
      currentUser = auth.currentUser;
      var imageRef = storage
        .ref()
        .child('Company pictures')
        .child(currentUser.email);
      imageRef.put(imageFile).then(function (result) {
        imageRef.getDownloadURL().then(function (result) {
          imageUrl = result;
          createCompany();
          window.location.href = 'profile.html';
        });
      });
    }
  });
}

function logIn() {
  event.preventDefault();
  userEmail = document.getElementById('userEmail').value;
  userPassword = document.getElementById('userPassword').value;
  auth
    .signInWithEmailAndPassword(userEmail, userPassword)
    .then(function (data) {
      window.location.href = 'profile.html';
      console.log('Usuario logeado correctamente');
    })
    .catch(function (error) {
      db.ref('workers/').once('value', (snapshot) => {
        const workerExist = snapshot.forEach((worker) => {
          const workerInfo = worker.val();
          const workerFound =
            workerInfo.email === userEmail &&
            workerInfo.password === userPassword;
          if (workerFound) {
            console.log('workerInfo:');
            console.log(workerInfo);
            if (workerInfo.isActive) {
              const workerData = {
                id: workerInfo.id,
                company: workerInfo.companyEmailRef,
                isActive: workerInfo.isActive,
              };
              setCookie(cookieName, JSON.stringify(workerData), 1);
            } else {
              swal({
                title: 'Usuario deshabilitado',
                text:
                  'Su usuario ha sido deshabilitado por el administrador de su empresa, ' +
                  'por favor comunicarse con este para más información.',
                icon: 'warning',
                button: 'Ok',
              });
            }
          }
          return workerFound;
        });
        if (!workerExist) {
          swal({
            title: 'Usuario o contraseña incorrectos!',
            text: 'Intente de nuevo',
            icon: 'warning',
            button: 'Ok',
          });
        } else {
          if (getCookie(cookieName)) {
            //window.location.href = 'question.html';
            window.location.href = 'question.html';
          }
        }
      });
    });
}

function logOut() {
  if (getCookie(cookieName)) {
    deleteCookie(cookieName);
    window.location.href = 'login.html';
  } else {
    deleteCookie(cookieName);
    auth.signOut().then(function () {
      console.log('Usuario ha cerrado sesion');
      window.location.href = 'login.html';
    });
  }
}

function recoverPassword() {
  recoverEmail = document.getElementById('userEmailRecover').value;
  auth
    .sendPasswordResetEmail(recoverEmail)
    .then(function () {
      console.log('Correo enviado');
    })
    .catch(function (error) {
      console.log('ErrorCode: ' + error.code + ', message: ' + error.message);
    });
}

function getCompany() {
  auth.onAuthStateChanged(function (user) {
    if (user) {
      var workersArray = [];
      var userId = auth.currentUser.uid;
      var ref = firebase.database().ref('companies');
      ref.on('value', function (snapshot) {
        snapshot.forEach(function (cs) {
          if (cs.val().id == userId) {
            document.getElementById(
              'agentNameProfile'
            ).value = cs.val().agentName;
            document.getElementById(
              'companyProfile'
            ).value = cs.val().companyName;
            document.getElementById('userEmailProfile').value =
              auth.currentUser.email;
            document.getElementById('phoneProfile').value = cs.val().phone;
            document.getElementById('docNumProfile').value = cs.val().docNum;
            document.getElementById(
              'imageCompanyProfile'
            ).src = cs.val().photoUrl;
          }
        });
      });
      db.ref('companies/' + auth.currentUser.uid + '/workers').on(
        'child_added',
        function (data) {
          workersArray.push(data.val());
          document.getElementById('workersQty').textContent =
            workersArray.length;
          console.log(workersArray.length);
        }
      );
    }
  });
}

function createOperator() {
  nameWorker = document.getElementById('nameWorker').value;
  emailWorker = document.getElementById('userEmailWorker').value;
  passwordWorker = document.getElementById('passwordWorker').value;
  workerId = generateWorkerId();
  var imageRef = storage.ref().child('Operators pictures').child(emailWorker);
  imageRef.put(workerImageFile).then(function (result) {
    imageRef.getDownloadURL().then(function (result) {
      workerImageUrl = result;
      var workerObj = {
        id: workerId,
        companyEmailRef: auth.currentUser.uid,
        name: nameWorker,
        email: emailWorker,
        password: passwordWorker,
        photoUrl: workerImageUrl,
        admin: false,
      };
      //Create reference into workers collection
      db.ref('workers/' + workerId).set(workerObj);
      //Create reference into companie/uid/workers
      var update = {};
      update[
        'companies/' + auth.currentUser.uid + '/workers/' + workerId
      ] = workerObj;
      db.ref().update(update);
      // admin
      //   .auth()
      //   .createUserWith({
      //     email: emailWorker,
      //     emailVerified: true,
      //     password: passwordWorker,
      //     disabled: false,
      //   })
      //   .then(function (userRecord) {
      //     swal({
      //       title: 'Operación exitosa',
      //       text: 'Operador ' + nameWorker + ' ' + lastName,
      //       icon: 'success',
      //       button: 'Ok',
      //     });
      //   })
      //   .catch(function (error) {
      //     swal({
      //       title: 'Error al crear operador',
      //       text: error.message,
      //       icon: 'warning',
      //       button: 'Ok',
      //     });
      //   });
    });
  });
}

function getWorkers() {
  auth.onAuthStateChanged(function (user) {
    if (user) {
      db.ref('companies/' + auth.currentUser.uid + '/workers').on(
        'child_added',
        function (data) {
          //debugger;
          console.log(data.val());
          //$('.table').DataTable().destroy();
          if ($.fn.DataTable.isDataTable('#workers-table'))
            $('#workers-table').DataTable().destroy();
          document.getElementById('tableBodyOperators').innerHTML += `
      <tr>
        <td>${data.val().name}</td>
        <td>${data.val().email}</td>
        <td>
          <div style="position: absolute;">
          <span data-toggle="modal" data-target="#getOperatorModal">
            <button
            type="button"
            class="btn btn-primary nav-button"
            style="display: inline-block;"
            data-toggle="tooltip" 
            data-placement="top"
            title="Ver operador"
            onclick="getWorker('${data.val().id}',1)"
            >
            <i class="fa fa-eye" aria-hidden="true"></i>
            </button>
          </span>
          <span data-toggle="modal" data-target="#editOperatorModal">
            <button
            type="button"
            class="btn btn-primary nav-button"
            style="display: inline-block;"
            data-toggle="tooltip" 
            data-placement="top"
            title="Editar operador"
            onclick="getWorker('${data.val().id}',2)"
            >
            <i class="fa fa-pencil" aria-hidden="true"></i>
            </button>
          </span>
          <button
            type="button"
            class="btn btn-primary nav-button"
            style="display: inline-block;"
            data-toggle="tooltip" 
            data-placement="top"
            title="Eliminar operador"
            onclick="deleteWorker('${data.val().id}')"
          >
            <i class="fa fa-times" aria-hidden="true"></i>
          </button>
          ${data.val().qResult? `<button
            type="button"
            class="btn btn-primary nav-button"
            style="display: inline-block;"
            data-toggle="tooltip" 
            data-placement="top"
            title="Ir a tests"
            onclick="diplayWorkerResults('${data.val().id}')"
          >
          <i class="fa fa-file-text-o" aria-hidden="true"></i>
          </button>`: ''}
          </div>
        </td>
      </tr>
      `;
          //???????
          $('#workers-table').DataTable();
        }
      );
    }
  });
  //console.log('Lorem Ipsum dolor sic amet');
}

function generateWorkerId() {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 28; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function getWorker(workerId, type) {
  db.ref('/workers/' + workerId).once('value', function (snapshot) {
    if (type == 1) {
      document.getElementById('workerName').value = snapshot.val().name;
      document.getElementById('workerEmail').value = snapshot.val().email;
      document.getElementById('workerPassword').value = snapshot.val().password;
      document.getElementById('workerImage').src = snapshot.val().photoUrl;
    } else {
      document.getElementById('workerNameEdit').value = snapshot.val().name;
      document.getElementById('workerEmailEdit').value = snapshot.val().email;
      document.getElementById(
        'workerPasswordEdit'
      ).value = snapshot.val().password;
      document.getElementById(
        'workerStateEdit'
      ).checked = snapshot.val().isActive;
      document.getElementById('workerImageEdit').src = snapshot.val().photoUrl;
      document.getElementById('workerId').value = workerId;
    }
  });
}

async function editWorker() {
  var workerObj = {
    id: document.getElementById('workerId').value,
    name: document.getElementById('workerNameEdit').value,
    email: document.getElementById('workerEmailEdit').value,
    password: document.getElementById('workerPasswordEdit').value,
    isActive: document.getElementById('workerStateEdit').checked,
    photoUrl: document.getElementById('imageWorkerEdit').src,
  };
  var updates = {};
  updates['workers/' + workerObj.id + '/name'] = workerObj.name;
  updates['workers/' + workerObj.id + '/email'] = workerObj.email;
  updates['workers/' + workerObj.id + '/password'] = workerObj.password;
  updates['workers/' + workerObj.id + '/isActive'] = workerObj.isActive;
  const imageEdit = document.getElementById('imageWorkerEdit').files[0];
  if (imageEdit) {
    var imageRef = storage.ref().child('Operators pictures/' + workerObj.email);
    let url = await imageRef.put(imageEdit).then(async function (result) {
      return await imageRef.getDownloadURL();
    });
    workerObj.photoUrl = url;
    //document.getElementById('imageWorkerEdit').src = result;
    updates['workers/' + workerObj.id + '/photoUrl'] = url;
    updates[
      'companies/' + auth.currentUser.uid + '/workers/' + workerObj.id
    ] = workerObj;
  } else {
    console.log('Image doesnt exist');
  }
  db.ref().update(updates, (err) => {
    if (!err) {
      window.location.href = 'list.html';
    }
  });
}

function deleteWorker(workerId) {
  swal({
    title: 'Deseas eliminar al operador?',
    text: 'Una vez eliminado perderás toda su información',
    icon: 'warning',
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      db.ref('workers/' + workerId).remove();
      db.ref(
        'companies/' + auth.currentUser.uid + '/workers/' + workerId
      ).remove();
      window.location.href = 'list.html';
    }
  });
}

function getCookie(cname) {
  let name = cname + '=';
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

function setCookie(cname, cvalue, exdays) {
  let d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

function deleteCookie(cname) {
  document.cookie = cname +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function addQuestion(qNumber) {
  document.getElementById('pills-tab').innerHTML += `
  <li class="nav-item">
    <a
      class="nav-link"
      id="pills-question-${qNumber}"
      data-toggle="pill"
      href="#pills-q${qNumber}"
      role="tab"
      aria-controls="pills-contact"
      aria-selected="false"
      >Pregunta ${qNumber}</a
      >
  </li>
  `;
  document.getElementById('pills-tabContent').innerHTML += `
  <div
    class="tab-pane fade"
    id="pills-q${qNumber}"
    role="tabpanel"
    aria-labelledby="pills-home-tab"
  >
    <div class="row">
      <div class="col-lg-12">
        <div class="form-group">
          <label
            class="label-login"
            style="font-family: Montserrat;"
            >Enunciado</label
          >
          <textarea
            class="form-control"
            id="enunciado-${qNumber}"
            rows="3"
          ></textarea>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-lg-6">
        <label
          class="label-login"
          style="font-family: Montserrat;"
          >Opciones</label
        >
        <div class="row">
          <div class="col-lg-12" style="margin-bottom: 10px;">
            <input
              type="text"
              id="op-a-${qNumber}"
              class="form-control"
              placeholder="Opción A"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-lg-12" style="margin-bottom: 10px;">
            <input
              type="text"
              id="op-b-${qNumber}"
              class="form-control"
              placeholder="Opción B"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-lg-12" style="margin-bottom: 10px;">
            <input
              type="text"
              id="op-c-${qNumber}"
              class="form-control"
              placeholder="Opción C"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="row">
          <div class="col-lg-6">
            <div class="row">
              <div class="col-lg-12">
                <label
                  class="label-login"
                  style="font-family: Montserrat;"
                  >Respuesta correcta</label
                >
              </div>
            </div>
            <div class="row">
              <div class="col-lg-12">
                <select id="resp-${qNumber}" class="form-control">
                  <option value="0">Opción A</option>
                  <option value="1">Opción B</option>
                  <option value="2">Opción C</option>
                </select>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="row">
              <div class="col-lg-12">
                <div class="row">
                  <div class="col-lg-12">
                    <label
                      class="label-login"
                      style="font-family: Montserrat;"
                      >Valor de pregunta</label
                    >
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-lg-5">
                <input
                  type="number"
                  id="grade-${qNumber}"
                  class="form-control"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
  //qNumber++;
}
function loadQuestions() {
  for (let i = 1; i <= 5; i++) {
    addQuestion(i);
  }
}

function addQuestionnaire() {
  firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
      const questionArray = [];
      for (let i = 1; i <= 5; i++) {
        const question = {
          statement: document.getElementById('enunciado-' + i).value,
          value: document.getElementById('grade-' + i).value,
          optionA: document.getElementById('op-a-' + i).value,
          optionB: document.getElementById('op-b-' + i).value,
          optionC: document.getElementById('op-c-' + i).value,
          ans: document.getElementById('resp-' + i).value,
        };
        questionArray.push(question);
      }
      const questionnarieId = await db
        .ref(`/companies/${user.uid}/questionnaries`)
        .push().key;
      db.ref(`/companies/${user.uid}/questionnaries/${questionnarieId}`).set({
        id: questionnarieId,
        questions: questionArray,
      });
      console.log('Questionnaire loaded!');
    }
  });
}

async function initQuestionnaire(){
  try {
    auth.onAuthStateChanged(async (user) =>{
      if (user) {

        const userData = (await db.ref(`/workers/${getCookie(wResultsCookie)}`).once('value')).val();
        console.log(userData);
        const companyData = (await db.ref(`/companies/${user.uid}`).once('value')).val();
        document.getElementById('questionnaire-title').innerHTML='Test de ' + companyData.companyName;
        const {qResult} = userData;
        const {questions} = companyData.questionnaries[Object.keys(companyData.questionnaries)[0]]
        const template = qResult.answers.map((ans,i) => {
          return questionnaireTemplate(questions[i],i,true,ans.option)
        }).reduce((prev='',curr) => prev + curr)
        + `
          <button type="button" class="btn btn-secondary" onclick="deleteWorkerResults()">
            <i class="fa fa-trash-o" aria-hidden="true"></i>
            Borrar respuestas
          </button>
        `;
        document.getElementById('questionnaire-body').innerHTML+=template;
        questionnaireResult(qResult.score,qResult.maxScore);

      } else {

        const userInfo = JSON.parse(getCookie(cookieName));
        const userData = (await db.ref(`/workers/${userInfo.id}`).once('value')).val();
        console.log(userData);
        const companyData = (await db.ref(`/companies/${userInfo.company}`).once('value')).val();
        document.getElementById('questionnaire-title').innerHTML='Test de ' + companyData.companyName;
        if(userData.qResult){
          const {qResult} = userData;
          const {questions} = await fecthQuestionnaireWorker();
          const template = qResult.answers.map((ans,i) => {
            return questionnaireTemplate(questions[i],i,true,ans.option)
          }).reduce((prev='',curr) => prev + curr);
          document.getElementById('questionnaire-body').innerHTML+=template;
          questionnaireResult(qResult.score,qResult.maxScore);
        } else {
          loadQuestionnaire();
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
}
async function fecthQuestionnaireWorker() {
  const userInfo = JSON.parse(getCookie(cookieName));
  const questionnaries = (await db.ref(`companies/${userInfo.company}/questionnaries`).once('value')).val();
  return questionnaries[Object.keys(questionnaries)[0]];
}
async function loadQuestionnaire(){
  try {
    const questionnarieData = await fecthQuestionnaireWorker();
    console.log(questionnarieData);
    //const questionarie = questionaries;
    let template = '';
    questionnarieData.questions.forEach((question,i) => {
      console.log(question);
      template+=questionnaireTemplate(question,i);
    });
    template+=`
      <button type="button" class="btn btn-secondary" onclick="sendQuestionnaire()">
        <i class="fa fa-paper-plane" aria-hidden="true"></i>
        Enviar respuestas
      </button>
    `;
    document.getElementById('questionnaire-body').innerHTML =template;
  } catch (error) {
    console.log(error);
  }
}

function questionnaireTemplate(question,i,sol=false,res=''){
  return `
    <div id="question-${i}" class="shadow card mb-3 questionnarie">
      <div class="card-body">
        <h3 class="card-title">Pregunta ${(i+1)}</h3>
        <p class="card-text">
          ${question.statement}
        </p>
        <!--Type question component-->
        <div class="custom-control custom-radio">
          <input
            type="radio"
            id="op-a-${i}"
            name="resp-${i}"
            value="${question.ans==0?question.value:0}"
            class="custom-control-input"
            ${sol?'disabled':''}
            ${res === 'a'?'checked':''}
          />
          <label class="custom-control-label" for="op-a-${i}"
            >${question.optionA}</label
          >
        </div>
        <div class="custom-control custom-radio">
          <input
            type="radio"
            id="op-b-${i}"
            name="resp-${i}"
            value="${question.ans==1?question.value:0}"
            class="custom-control-input"
            ${sol?'disabled':''}
            ${res === 'b'?'checked':''}
          />
          <label class="custom-control-label" for="op-b-${i}"
            >${question.optionB}</label
          >
        </div>
        <div class="custom-control custom-radio">
          <input
            type="radio"
            id="op-c-${i}"
            name="resp-${i}"
            value="${question.ans==1?question.value:0}"
            class="custom-control-input"
            ${sol?'disabled':''}
            ${res === 'c'?'checked':''}
          />
          <label class="custom-control-label" for="op-c-${i}"
            >${question.optionC}</label
          >
        </div>
      </div>
    </div>
  `;
}

function sendQuestionnaire(){
  try {
    const questions = document.getElementsByClassName('questionnarie').length;
    const questionarieAnswers = [];
    const scores = []
    for (let i = 0; i < questions; i++) {
      const option = Array.from(document.getElementsByName('resp-'+i)).find((ans) => ans.checked);
      if (!option) {
        throw "Questionnaire incomplete"
      }
      scores.push(Array.from(document.getElementsByName('resp-'+i)).find((ans) => ans.value!=0).value);
      questionarieAnswers.push({
        option:option.id[3],
        value: option.value,
      });
    }
    const result = {
      answers:questionarieAnswers,
      maxScore:scores.reduce((prev=0,curr) => Number(prev) + Number(curr)),
      score:questionarieAnswers.map((el) => el.value).reduce((prev=0,curr,)=> Number(prev) + Number(curr)),
    }
    const update={};
    const userInfo = JSON.parse(getCookie(cookieName));
    update[`/companies/${userInfo.company}/workers/${userInfo.id}/qResult`]=result;
    update[`/workers/${userInfo.id}/qResult`]=result;
    db.ref().update(update, (err) => {
      if (!err) {
        window.location.href = 'question.html';
      } else {
        console.log(err);
      }
    });
  } catch (error) {
    swal({
      title: 'Cuestionario incompleto!',
      text: 'Debe terminar de responder el cuestionario antes de enviarlo.',
      icon: 'warning',
      button: 'Ok',
    });
    console.log(error);
  }
  
  //document.getElementsByClassName('question').
}

function questionnaireResult(score,maxScore) {
  document.getElementById('questionnaire').innerHTML+= `
    <div class="col-lg-4">
      <div class="col-lg-12 score">
        <div class="row">
          <div class="col-lg-12 score-title">
            <h2>Puntaje del test</h2>
            <p class="score-body">${score}/${maxScore}<span class="pts">Pts</span></p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function diplayWorkerResults(id) {
  setCookie(wResultsCookie,id,1);
  //window.location.href='workerResults.html';
  window.location.href='question.html';
}
function deleteWorkerResults(){
  auth.onAuthStateChanged((user) =>{
    db.ref(`/workers/${getCookie(wResultsCookie)}/qResult`).remove();
    db.ref(`/companies/${user.uid}/workers/${getCookie(wResultsCookie)}/qResult`).remove();
    deleteCookie(wResultsCookie);
    window.location.href='list.html';
  });
}
// function removeQuestion() {
//   qNumber--;
//   document.getElementById('pills-tab').children[qNumber].remove();
//   document.getElementById('pills-tabContent').children[qNumber].remove();
// }
