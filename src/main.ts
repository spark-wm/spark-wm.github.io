import { createApp } from 'vue'
import './styles.css'
import App from './App.vue'
import RecordPipeline from './components/RecordPipeline.vue'

const record = new URLSearchParams(location.search).get('record') === 'pipeline'
if (record) document.body.style.margin = '0'
createApp(record ? RecordPipeline : App).mount('#app')
