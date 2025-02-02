// リファクタリング済みのキーボードイベント処理ハンドラ
// 各イベントごとに個別の関数に分離し、処理の明確化とフォーカス管理の一元化を目指しています。

import React from 'react';

// キーボードイベントに対する共通のインターフェース
export type TreeKeyboardEvent = React.KeyboardEvent;

// Tabキー処理：フォーカス管理や子ノード追加の制御を集中管理
export const handleTabEvent = (event: TreeKeyboardEvent) => {
  // デフォルトのTab動作を無効化してカスタムフォーカス移動を実施
  event.preventDefault();
  // ここで、フォーカス管理用のロジックまたは専用カスタムフックを呼び出す
  // 例: focusManager.moveFocus('next');
  console.log('Tabキーが押されました。フォーカス移動処理を実行します。');
};

// Enterキー処理：子ノードの追加処理を担当
// useTreeNode.tsのkeyboardHandlersで実際の処理が行われるため、
// ここではイベントのデフォルト動作の防止のみを行います
export const handleEnterEvent = (event: TreeKeyboardEvent) => {
  event.preventDefault();
};

// Deleteキー処理：ノード削除などの処理を担当（必要に応じて拡張）
export const handleDeleteEvent = (event: TreeKeyboardEvent) => {
  event.preventDefault();
  // ノード削除のロジックをここに記述
  // 例: nodeManager.deleteNode(currentNodeId);
  console.log('Deleteキーが押されました。ノード削除処理を実行します。');
};

// メインのキーボードイベントハンドラ
// 各キーに対応する個別ハンドラへ処理をルーティングします
export const onKeyDown = (event: TreeKeyboardEvent) => {
  switch (event.key) {
    case 'Tab':
      handleTabEvent(event);
      break;
    case 'Enter':
      handleEnterEvent(event);
      break;
    case 'Delete':
      handleDeleteEvent(event);
      break;
    default:
      // その他のキーは標準動作のままとするか、必要に応じて処理を追加する
      break;
  }
};

// React コンポーネントでハンドラを利用する場合の例
// 例：<div onKeyDown={onKeyDown}>...</div>
