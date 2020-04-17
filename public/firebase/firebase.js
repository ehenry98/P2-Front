var imageFile;
var imageUrl;
var workerImageFile;
var workerImageUrl;

const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

function setCompanyPicture(event) {
  imageFile = event.target.files[0];
}

function setWorkerPicture(event) {
  workerImageFile = event.target.files[0];
}

function createCompany() {
  agentName = document.getElementById('agentName').value;
  companyName = document.getElementById('company').value;
  docType = document.getElementById('docType').value;
  docNum = document.getElementById('docNum').value;
  phone = document.getElementById('phone').value;
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
    .then(function () {
      window.location.href = 'list.html';
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
    .then(function () {
      window.location.href = 'profile.html';
      console.log('Usuario logeado correctamente');
    })
    .catch(function (error) {
      console.log('ErrorCode: ' + error.code + ', message: ' + error.message);
    });
}

function logOut() {
  auth.signOut().then(function () {
    console.log('Usuario ha cerrado sesion');
    window.location.href = 'login.html';
  });
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
    }
  });
}

function createOperator() {
  nameWorker = document.getElementById('nameWorker').value;
  lastName = 'PRUEBA';
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
        lastName: lastName,
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
    });
  });
}

function getWorkers() {
  db.ref('workers').on('child_added', function (data) {
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
        <button
          type="button"
          class="btn btn-primary nav-button"
          style="display: inline-block;"
          data-toggle="modal"
          data-target="#getOperatorModal"
          onclick="getWorker('${data.val().id}',1)"
        >
          <i class="fa fa-eye" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="btn btn-primary nav-button"
          style="display: inline-block;"
          data-toggle="modal"
          data-target="#editOperatorModal"
          onclick="getWorker('${data.val().id}',2)"
        >
          <i class="fa fa-pencil" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="btn btn-primary nav-button"
          style="display: inline-block;"
          onclick="deleteWorker('${data.val().id}')"
        >
          <i class="fa fa-times" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="btn btn-primary nav-button"
          style="display: inline-block;"
        >
          <i class="fas fa-arrow-alt-circle-right"></i> Ir al test
        </button>
      </div>
    </td>
  </tr>
  `;
    //???????
    $('#workers-table').DataTable();
  });
  console.log('Lorem Ipsum dolor sic amet');
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
      document.getElementById('workerLastName').value = snapshot.val().lastName;
      document.getElementById('workerEmail').value = snapshot.val().email;
      document.getElementById('workerPassword').value = snapshot.val().password;
      document.getElementById('workerImage').src = snapshot.val().photoUrl;
    } else {
      document.getElementById('workerNameEdit').value = snapshot.val().name;
      document.getElementById(
        'workerLastNameEdit'
      ).value = snapshot.val().lastName;
      document.getElementById('workerEmailEdit').value = snapshot.val().email;
      document.getElementById(
        'workerPasswordEdit'
      ).value = snapshot.val().password;
      document.getElementById('workerImageEdit').src = snapshot.val().photoUrl;
      document.getElementById('workerId').value = workerId;
    }
  });
}

function editWorker() {
  workerObj = {
    id: document.getElementById('workerId').value,
    name: document.getElementById('workerNameEdit').value,
    lastName: document.getElementById('workerLastNameEdit').value,
    email: document.getElementById('workerEmailEdit').value,
    password: document.getElementById('workerPasswordEdit').value,
    workerImage: document.getElementById('workerImageEdit').src,
  };
  var updates = {};
  updates['workers/' + workerObj.id + '/name'] = workerObj.name;
  updates['workers/' + workerObj.id + '/lastName'] = workerObj.lastName;
  updates['workers/' + workerObj.id + '/email'] = workerObj.email;
  updates['workers/' + workerObj.id + '/password'] = workerObj.password;
  updates['workers/' + workerObj.id + '/photoUrl'] = workerObj.workerImage;
  updates[
    'companies/' + auth.currentUser.uid + '/workers/' + workerObj.id
  ] = workerObj;
  db.ref().update(updates);
  window.location.href = 'list.html';
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
