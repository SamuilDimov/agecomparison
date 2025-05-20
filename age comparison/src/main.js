import * as faceapi from 'face-api.js';

const video = document.getElementById('webcam');
const statusBox = document.getElementById('statusBox');
const photoBox = document.getElementById('photoBox');

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
  video.onloadeddata = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    await faceapi.nets.ageGenderNet.loadFromUri('/models');
    scanUserAge();
  };
});

function scanUserAge() {
  let scanTime = 5000;
  let ageSum = 0;
  let count = 0;

  // Start animation
  statusBox.classList.add('scanning');
  statusBox.innerText = '🔍 Scanning your face for age...';

  const interval = setInterval(async () => {
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender();
    if (detection) {
      ageSum += detection.age;
      count++;
    }
  }, 500);

  setTimeout(() => {
    clearInterval(interval);
    statusBox.classList.remove('scanning');

    const avgAge = count > 0 ? ageSum / count : null;
    if (avgAge) {
      const roundedAge = Math.round(avgAge);
      showArchiveMessage(roundedAge);
    } else {
      statusBox.innerText = '❌ No face detected during scan.';
    }
  }, scanTime);
}

function showArchiveMessage(age) {
  const sampleMatches = {
    10: {
      name: 'Ruth',
      age: 10,
      story: 'Ruth, age 10, deported to Theresienstadt.',
      img: 'ruth.jpg'
    },
    18: {
      name: 'David',
      age: 18,
      story: 'David, age 18, forced into labor in 1942.',
      img: 'david.jpg'
    },
    30: {
      name: 'Miriam',
      age: 30,
      story: 'Miriam, age 30, hid her children in a cellar.',
      img: 'miriam.jpg'
    },
    45: {
      name: 'Jakob',
      age: 45,
      story: 'Jakob, age 45, survived Auschwitz.',
      img: 'jakob.jpg'
    }
  };

  const closest = Object.keys(sampleMatches)
    .map(a => parseInt(a))
    .reduce((prev, curr) => Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev);

  const match = sampleMatches[closest];

  // Handle image or fallback
  photoBox.classList.remove('missing');
  if (match.img) {
    photoBox.src = `/images/${match.img}`;
  } else {
    photoBox.src = '/images/question.png';
    photoBox.classList.add('missing');
  }

  statusBox.innerText = `📍 Age detected: ${age}\n🕯 ${match.story}\nThat could have been you.`;
}
